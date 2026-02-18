// Main ray-trace orchestration and final scene-color output.
struct TraceResult {
    vec3  EscapeDir;      
    float FreqShift;      
    float Status;         
    vec4  AccumColor;     
    float CurrentSign;    
};

TraceResult TraceRay(vec2 FragUv, vec2 Resolution, 
                     mat4 iInverseCamRot, 
                     vec4 iBlackHoleRelativePosRs, 
                     vec4 iBlackHoleRelativeDiskNormal, 
                     vec4 iBlackHoleRelativeDiskTangen,
                     float iUniverseSign)
{

    TraceResult res;
    res.EscapeDir = vec3(0.0);
    res.FreqShift = 0.0;
    res.Status    = 0.0; 
    res.AccumColor = vec4(0.0);

    float Fov = tan(iFovRadians / 2.0);
    vec2 Jitter = vec2(RandomStep(FragUv, fract(iTime * 1.0 + 0.5)), RandomStep(FragUv, fract(iTime * 1.0))) / Resolution;
    vec3 ViewDirLocal = FragUvToDir(FragUv + 0.25 * Jitter, Fov, Resolution); 


    float iSpinclamp = clamp(iSpin, -0.99, 0.99);
    float a2 = iSpinclamp * iSpinclamp;
    float abs_a = abs(iSpinclamp);
    float common_term = pow(1.0 - a2, 1.0/3.0);
    float Z1 = 1.0 + common_term * (pow(1.0 + abs_a, 1.0/3.0) + pow(1.0 - abs_a, 1.0/3.0));
    float Z2 = sqrt(3.0 * a2 + Z1 * Z1);
    float root_term = sqrt(max(0.0, (3.0 - Z1) * (3.0 + Z1 + 2.0 * Z2))); 
    float Rms_M = 3.0 + Z2 - (sign(iSpinclamp) * root_term); 
    float RmsRatio = Rms_M / 2.0; 
    float AccretionEffective = sqrt(max(0.001, 1.0 - (2.0 / 3.0) / Rms_M));

    
    const float kPhysicsFactor = 1.52491e30; 
    float DiskArgument = kPhysicsFactor / iBlackHoleMassSol * (iMu / AccretionEffective) * (iAccretionRate);
    float PeakTemperature = pow(DiskArgument * 0.05665278, 0.25);

    
    float PhysicalSpinA = iSpin * CONST_M;  
    float PhysicalQ     = iQ * CONST_M; 
    
    
    float HorizonDiscrim = 0.25 - PhysicalSpinA * PhysicalSpinA - PhysicalQ * PhysicalQ;
    float EventHorizonR = 0.5 + sqrt(max(0.0, HorizonDiscrim));
    float InnerHorizonR = 0.5 - sqrt(max(0.0, HorizonDiscrim));
    bool  bIsNakedSingularity = HorizonDiscrim < 0.0;

    
    float RaymarchingBoundary = max(iOuterRadiusRs + 1.0, 501.0);
    float BackgroundShiftMax = 2.0;
    float ShiftMax = 1.0; 
    float CurrentUniverseSign = iUniverseSign;


    vec3 CamToBHVecVisual = (iInverseCamRot * vec4(iBlackHoleRelativePosRs.xyz, 0.0)).xyz;
    vec3 RayPosWorld = -CamToBHVecVisual; 
    vec3 DiskNormalWorld = normalize((iInverseCamRot * vec4(iBlackHoleRelativeDiskNormal.xyz, 0.0)).xyz);
    vec3 DiskTangentWorld = normalize((iInverseCamRot * vec4(iBlackHoleRelativeDiskTangen.xyz, 0.0)).xyz);
    
    vec3 BH_Y = normalize(DiskNormalWorld);             
    vec3 BH_X = normalize(DiskTangentWorld);            
    BH_X = normalize(BH_X - dot(BH_X, BH_Y) * BH_Y);
    vec3 BH_Z = normalize(cross(BH_X, BH_Y));           
    mat3 LocalToWorldRot = mat3(BH_X, BH_Y, BH_Z);
    mat3 WorldToLocalRot = transpose(LocalToWorldRot);
    
    vec3 RayPosLocal = WorldToLocalRot * RayPosWorld;
    vec3 RayDirWorld_Geo = WorldToLocalRot * normalize((iInverseCamRot * vec4(ViewDirLocal, 0.0)).xyz);

    vec4 Result = vec4(0.0);
    bool bShouldContinueMarchRay = true;
    bool bWaitCalBack = false;
    float DistanceToBlackHole = length(RayPosLocal);
    
    
    float GlobalMinGeoR = 10000.0;
    
    if (DistanceToBlackHole > RaymarchingBoundary) 
    {
        vec3 O = RayPosLocal; vec3 D = RayDirWorld_Geo; float r = RaymarchingBoundary - 1.0; 
        float b = dot(O, D); float c = dot(O, O) - r * r; float delta = b * b - c; 
        if (delta < 0.0) { 
            bShouldContinueMarchRay = false; 
            bWaitCalBack = true; 
        } 
        else {
            float tEnter = -b - sqrt(delta); 
            if (tEnter > 0.0) RayPosLocal = O + D * tEnter;
            else if (-b + sqrt(delta) <= 0.0) { 
                bShouldContinueMarchRay = false; 
                bWaitCalBack = true; 
            }
        }
    }


    vec4 X = vec4(RayPosLocal, 0.0);
    vec4 P_cov = vec4(-1.0);
    float E_conserved = 1.0;
    vec3 RayDir = RayDirWorld_Geo;
    vec3 LastDir = RayDir;
    vec3 LastPos = RayPosLocal;
    float GravityFade = CubicInterpolate(max(min(1.0 - (length(RayPosLocal) - 100.0) / (RaymarchingBoundary - 100.0), 1.0), 0.0));

    if (bShouldContinueMarchRay) {
       P_cov = GetInitialMomentum(RayDir, X, iObserverMode, iUniverseSign, PhysicalSpinA, PhysicalQ, GravityFade);
       
    }
    E_conserved = -P_cov.w;
    
    #if ENABLE_HEAT_HAZE == 1
    {
        
        vec3 pos_Rg_Start = X.xyz; 
        vec3 rayDirNorm = normalize(RayDir);

        float totalProbeDist = float(HAZE_PROBE_STEPS) * HAZE_STEP_SIZE;
        
        
        float hazeTime = mod(iTime, 1000.0); 

        
        #if HAZE_DEBUG_MASK == 1
        {
            float debugAccum = 0.0;
            float debugStep = 1.0; 
            vec3 debugPos = pos_Rg_Start;
            
            
            float rotSpeedBase = 100.0 * HAZE_ROT_SPEED;
            float jetSpeedBase = 50.0 * HAZE_FLOW_SPEED;
            
            
            float ReferenceOmega = GetKeplerianAngularVelocity(6.0, 1.0, PhysicalSpinA, PhysicalQ);
            float AdaptiveFrequency = abs(ReferenceOmega * rotSpeedBase) / (2.0 * kPi * 5.14);
            AdaptiveFrequency = max(AdaptiveFrequency, 0.1);
            float flowTime = hazeTime * AdaptiveFrequency;

            float phase1 = fract(flowTime); float phase2 = fract(flowTime + 0.5);
            float weight1 = 1.0 - abs(2.0 * phase1 - 1.0); float weight2 = 1.0 - abs(2.0 * phase2 - 1.0);
            float t_offset1 = phase1 - 0.5; float t_offset2 = phase2 - 0.5;
            
            
            float VerticalDrift1 = t_offset1 * 1.0; 
            float VerticalDrift2 = t_offset2 * 1.0;

            bool doLayer1 = weight1 > 0.05;
            bool doLayer2 = weight2 > 0.05;
            
            float wTotal = (doLayer1 ? weight1 : 0.0) + (doLayer2 ? weight2 : 0.0);
            float w1_norm = (doLayer1 && wTotal > 0.0) ? (weight1 / wTotal) : 0.0;
            float w2_norm = (doLayer2 && wTotal > 0.0) ? (weight2 / wTotal) : 0.0;

            for(int k=0; k<100; k++)
            {
                float valCombined = 0.0;

                
                float maskDisk = GetDiskHazeMask(debugPos, iInterRadiusRs, iOuterRadiusRs, iThinRs, iHopper);
                if (maskDisk > 0.001) {
                    float r_local = length(debugPos.xz);
                    float omega = GetKeplerianAngularVelocity(r_local, 1.0, PhysicalSpinA, PhysicalQ);
                    
                    float vDisk = 0.0;
                    if (doLayer1) {
                        float angle1 = omega * rotSpeedBase * t_offset1;
                        float c1 = cos(angle1); float s1 = sin(angle1);
                        vec3 pos1 = debugPos;
                        pos1.x = debugPos.x * c1 - debugPos.z * s1;
                        pos1.z = debugPos.x * s1 + debugPos.z * c1;
                        pos1.y += VerticalDrift1; 
                        vDisk += GetBaseNoise(pos1) * w1_norm;
                    }
                    if (doLayer2) {
                        float angle2 = omega * rotSpeedBase * t_offset2;
                        float c2 = cos(angle2); float s2 = sin(angle2);
                        vec3 pos2 = debugPos;
                        pos2.x = debugPos.x * c2 - debugPos.z * s2;
                        pos2.z = debugPos.x * s2 + debugPos.z * c2;
                        pos2.y += VerticalDrift2;
                        vDisk += GetBaseNoise(pos2) * w2_norm;
                    }
                    valCombined += maskDisk * max(0.0, vDisk - HAZE_DENSITY_THRESHOLD);
                }

                
                float maskJet = GetJetHazeMask(debugPos, iInterRadiusRs, iOuterRadiusRs);
                if (maskJet > 0.001) {
                    float v_jet_mag = 0.9;
                    float vJet = 0.0;
                    
                    if (doLayer1) {
                        float dist1 = v_jet_mag * jetSpeedBase * t_offset1;
                        vec3 pos1 = debugPos; pos1.y -= sign(debugPos.y) * dist1;
                        vJet += GetBaseNoise(pos1) * w1_norm;
                    }
                    if (doLayer2) {
                        float dist2 = v_jet_mag * jetSpeedBase * t_offset2;
                        vec3 pos2 = debugPos; pos2.y -= sign(debugPos.y) * dist2;
                        vJet += GetBaseNoise(pos2) * w2_norm;
                    }
                    valCombined += maskJet * max(0.0, vJet - HAZE_DENSITY_THRESHOLD);
                }
                
                debugAccum += valCombined * 0.1; 
                debugPos += rayDirNorm * debugStep;
            }
            
            res.Status = 3.0; 
            res.AccumColor = vec4(vec3(min(1.0, debugAccum)), 1.0);
            return res;
        }
        #endif

        
        if (IsInHazeBoundingVolume(pos_Rg_Start, totalProbeDist, iOuterRadiusRs)) 
        {
            vec3 accumulatedForce = vec3(0.0);
            float totalWeight = 0.0;

            
            for (int i = 0; i < HAZE_PROBE_STEPS; i++)
            {
                float marchDist = float(i + 1) * HAZE_STEP_SIZE; 
                vec3 probePos_Rg = pos_Rg_Start + rayDirNorm * marchDist;

                float t = float(i+1) / float(HAZE_PROBE_STEPS);
                float weight = min(min(3.0*t, 1.0), 3.05 - 3.0*t);
                
                vec3 forceSample = GetHazeForce(probePos_Rg, hazeTime, PhysicalSpinA, PhysicalQ,
                                              iInterRadiusRs, iOuterRadiusRs, iThinRs, iHopper,
                                              iAccretionRate);
                
                accumulatedForce += forceSample * weight;
                totalWeight += weight;
            }

            vec3 avgHazeForce = accumulatedForce / max(0.001, totalWeight);

            
            #if HAZE_DEBUG_VECTOR == 1
                if (length(avgHazeForce) > 1e-4) {
                    res.Status = 3.0;
                    vec3 debugVec = normalize(avgHazeForce) * 0.5 + 0.5;
                    debugVec *= (0.5 + 10.0 * length(avgHazeForce)); 
                    res.AccumColor = vec4(debugVec, 1.0);
                    return res;
                }
            #endif

            
            float forceMagSq = dot(avgHazeForce, avgHazeForce);
            if (forceMagSq > 1e-10)
            {
                
                vec3 forcePerp = avgHazeForce - dot(avgHazeForce, rayDirNorm) * rayDirNorm;
                
                
                vec3 deflection = forcePerp * HAZE_STRENGTH * 25.0; 
                
                
                P_cov.xyz += deflection;


                RayDir = normalize(RayDir + deflection * 0.1); 
                LastDir = RayDir;
            }
        }
    }
    #endif


    float TerminationR = -1.0; 
    float CameraStartR = KerrSchildRadius(RayPosLocal, PhysicalSpinA, CurrentUniverseSign);
    
    if (CurrentUniverseSign > 0.0) 
    {
        
        if (iObserverMode == 0) 
        {
            float CosThetaSq = (RayPosLocal.y * RayPosLocal.y) / (CameraStartR * CameraStartR + 1e-20);
            float SL_Discrim = 0.25 - PhysicalQ * PhysicalQ - PhysicalSpinA * PhysicalSpinA * CosThetaSq;
            
            if (SL_Discrim >= 0.0) {
                float SL_Outer = 0.5 + sqrt(SL_Discrim);
                float SL_Inner = 0.5 - sqrt(SL_Discrim); 
                
                if (CameraStartR < SL_Outer && CameraStartR > SL_Inner) {
                    bShouldContinueMarchRay = false; 
                    bWaitCalBack = false; 
                    Result = vec4(0.0, 0.0, 0.0, 1.0); 
                } 
            }
        }
        else
        {
        
        }
        
        if (!bIsNakedSingularity && CurrentUniverseSign > 0.0) 
        {
            if (CameraStartR > EventHorizonR) TerminationR = EventHorizonR; 
            else if (CameraStartR > InnerHorizonR) TerminationR = InnerHorizonR;
            else TerminationR = -1.0;
        }
    }
    
    
    float AbsSpin = abs(CONST_M * iSpin);
    float Q2 = iQ * iQ * CONST_M * CONST_M; 
    

    float AcosTerm = acos(clamp(-abs(iSpin), -1.0, 1.0));
    float PhCoefficient = 1.0 + cos(0.66666667 * AcosTerm);
    float r_guess = 2.0 * CONST_M * PhCoefficient; 
    float r = r_guess;
    float sign_a = 1.0; 
    
    for(int k=0; k<3; k++) {
        float Mr_Q2 = CONST_M * r - Q2;
        float sqrt_term = sqrt(max(0.0001, Mr_Q2)); 
        
        
        float f = r*r - 3.0*CONST_M*r + 2.0*Q2 + sign_a * 2.0 * AbsSpin * sqrt_term;
        
        
        float df = 2.0*r - 3.0*CONST_M + sign_a * AbsSpin * CONST_M / sqrt_term;
        
        if(abs(df) < 0.00001) break;
    
        r = r - f / df;
    }
    
    float ProgradePhotonRadius = r;

    float MaxStep=150.0+300.0/(1.0+1000.0*(1.0-iSpin*iSpin-iQ*iQ)*(1.0-iSpin*iSpin-iQ*iQ));
    if(bIsNakedSingularity) MaxStep=450.0;


    int Count = 0;
    float lastR = 0.0;
    bool bIntoOutHorizon = false;
    bool bIntoInHorizon = false;
    float LastDr = 0.0;           
    int RadialTurningCounts = 0;  
    float RayMarchPhase = RandomStep(FragUv, iTime); 
    
    float ThetaInShell=0.0;
    
    vec3 RayPos = X.xyz; 

    while (bShouldContinueMarchRay)
    {
        DistanceToBlackHole = length(RayPos);
        if (DistanceToBlackHole > RaymarchingBoundary)
        { 
            bShouldContinueMarchRay = false; 
            bWaitCalBack = true; 
            break; 
        }
        
        KerrGeometry geo;
        ComputeGeometryScalars(X.xyz, PhysicalSpinA, PhysicalQ, GravityFade, CurrentUniverseSign, geo);

        if (CurrentUniverseSign > 0.0 && geo.r < TerminationR && !bIsNakedSingularity && TerminationR != -1.0) 
        { 
            bShouldContinueMarchRay = false;
            bWaitCalBack = false;
            
            break; 
        }
        if (float(Count) > MaxStep) 
        { 
            bShouldContinueMarchRay = false; 
            bWaitCalBack = false;
            if(bIsNakedSingularity&&RadialTurningCounts <= 2) bWaitCalBack = true;
            
            break; 
        }

        State s0; s0.X = X; s0.P = P_cov;
        State k1 = GetDerivativesAnalytic(s0, PhysicalSpinA, PhysicalQ, GravityFade, geo);
        float CurrentDr = dot(geo.grad_r, k1.X.xyz);
        if (Count > 0 && CurrentDr * LastDr < 0.0) RadialTurningCounts++;
        LastDr = CurrentDr;
        if(iGrid==0)
        {
            {

                if (RadialTurningCounts > 2) 
                {
                    bShouldContinueMarchRay = false; bWaitCalBack = false;
                    
                    break;
                }
                
            }
            
            if(geo.r > InnerHorizonR && lastR < InnerHorizonR) bIntoInHorizon = true;     
            if(geo.r > EventHorizonR && lastR < EventHorizonR) bIntoOutHorizon = true;    
            
            if (CurrentUniverseSign > 0.0 && !bIsNakedSingularity)
            {
            
            
                float SafetyGap = 0.001;
                float PhotonShellLimit = ProgradePhotonRadius - SafetyGap; 
                float preCeiling = min(CameraStartR - SafetyGap, TerminationR + 0.2);
                if(bIntoInHorizon) { preCeiling = InnerHorizonR + 0.2; } 
                if(bIntoOutHorizon) { preCeiling = EventHorizonR + 0.2; }
                
                float PruningCeiling = min(iInterRadiusRs, preCeiling);
                PruningCeiling = min(PruningCeiling, PhotonShellLimit); 
            
                if (geo.r < PruningCeiling)
                {
                    float DrDlambda = dot(geo.grad_r, k1.X.xyz);
                    if (DrDlambda > 1e-4) 
                    {
                        bShouldContinueMarchRay = false;
                        bWaitCalBack = false;
                        
                        break; 
                    }
                }
            }
        }
        
        
        float rho = length(RayPos.xz);
        float DistRing = sqrt(RayPos.y * RayPos.y + pow(rho - abs(PhysicalSpinA), 2.0));
        float Vel_Mag = length(k1.X); 
        float Force_Mag = length(k1.P);
        float Mom_Mag = length(P_cov);
        
        float PotentialTerm = (PhysicalQ * PhysicalQ) / (geo.r2 + 0.01);
        float QDamping = 1.0 / (1.0 + 1.0 * PotentialTerm); 
        
      
        float ErrorTolerance = 0.5 * QDamping;
        float StepGeo =  DistRing / (Vel_Mag + 1e-9);
        float StepForce = Mom_Mag / (Force_Mag + 1e-15);
        
        float dLambda = ErrorTolerance*min(StepGeo, StepForce);
        dLambda = max(dLambda, 1e-7); 

        vec4 LastX = X;
        LastPos = X.xyz;
        GravityFade = CubicInterpolate(max(min(1.0 - ( DistanceToBlackHole - 100.0) / (RaymarchingBoundary - 100.0), 1.0), 0.0));
        
        vec4 P_contra_step = RaiseIndex(P_cov, geo);
        if (P_contra_step.w > 10000.0 && !bIsNakedSingularity && CurrentUniverseSign > 0.0) 
        { 
            bShouldContinueMarchRay = false; 
            bWaitCalBack = false;
            
            break; 
        }


        StepGeodesicRK4_Optimized(X, P_cov, E_conserved, -dLambda, PhysicalSpinA, PhysicalQ, GravityFade, CurrentUniverseSign, geo, k1);
        float deltar=geo.r-lastR;
        
        
        RayPos = X.xyz;
        vec3 StepVec = RayPos - LastPos;
        float ActualStepLength = length(StepVec);
        float drdl=deltar/max(ActualStepLength,1e-9);
        
        float rotfact=clamp(1.0   +   iBoostRot* dot(-StepVec,vec3(X.z,0,-X.x)) /ActualStepLength/length(X.xz)  *clamp(iSpin,-1.0,1.0)   ,0.0,1.0)   ;
        if( geo.r<1.6+pow(abs(iSpin),0.666666)){
        ThetaInShell+=ActualStepLength/(0.5*lastR + 0.5*geo.r)/(1.0+1000.0*drdl*drdl)*rotfact*clamp(11.0-10.0*(iSpin*iSpin+iQ*iQ),0.0,2.0);
        }
        lastR = geo.r;
        RayDir = (ActualStepLength > 1e-7) ? StepVec / ActualStepLength : LastDir;
        
        
        if (LastPos.y * RayPos.y < 0.0) {
            float t_cross = LastPos.y / (LastPos.y - RayPos.y);
            float rho_cross = length(mix(LastPos.xz, RayPos.xz, t_cross));
            if (rho_cross < abs(PhysicalSpinA)) CurrentUniverseSign *= -1.0;
        }

        
        if (CurrentUniverseSign > 0.0) 
        {
           Result = DiskColor(Result, ActualStepLength, X, LastX, RayDir, LastDir, P_cov, E_conserved,
                             iInterRadiusRs, iOuterRadiusRs, iThinRs, iHopper, iBrightmut, iDarkmut, iReddening, iSaturation, DiskArgument, 
                             iBlackbodyIntensityExponent, iRedShiftColorExponent, iRedShiftIntensityExponent, PeakTemperature, ShiftMax, 
                             clamp(PhysicalSpinA, -0.49, 0.49), 
                             PhysicalQ,
                             ThetaInShell,
                             RayMarchPhase 
                             );
           
           Result = JetColor(Result, ActualStepLength, X, LastX, RayDir, LastDir, P_cov, E_conserved,
                             iInterRadiusRs, iOuterRadiusRs, iJetRedShiftIntensityExponent, iJetBrightmut, iReddening, iJetSaturation, iAccretionRate, iJetShiftMax, 
                             0.0, 
                             PhysicalQ                            
                             ); 
        }
        if(iGrid==1)
        {
            Result = GridColor(Result, X, LastX, 
                        P_cov, E_conserved,
                        PhysicalSpinA, 
                        PhysicalQ, 
                        CurrentUniverseSign);
        }
        else if(iGrid==2)
        {
            Result = GridColorSimple(Result, X, LastX, 
                        PhysicalSpinA, 
                        PhysicalQ, 
                        CurrentUniverseSign);
        }
        if (Result.a > 0.99) { bShouldContinueMarchRay = false; bWaitCalBack = false; break; }
        
        LastDir = RayDir;
        Count++;
    }

    
    res.CurrentSign = CurrentUniverseSign;
    res.AccumColor  = Result;


    if (Result.a > 0.99) {
        
        res.Status = 3.0; 
        res.EscapeDir = vec3(0.0); 
        res.FreqShift = 0.0;
    } 
    else if (bWaitCalBack) {
        
        res.EscapeDir = LocalToWorldRot * normalize(RayDir);
        res.FreqShift = clamp(1.0 / max(1e-4, E_conserved), 1.0/2.0, 10.0); 
        
        if (CurrentUniverseSign  > 0.0) res.Status = 1.0; 
        else res.Status = 2.0; 
    } 
    else {
        
        res.Status = 0.0; 
        res.EscapeDir = vec3(0.0);
        res.FreqShift = 0.0;
    }

    return res;
}


void mainImage( out vec4 FragColor, in vec2 FragCoord )
{

    vec2 iResolution = iResolution.xy;
    vec2 Uv = FragCoord.xy / iResolution.xy;


    int  iBufWidth     = int(iChannelResolution[2].x);
    vec3 CamPosWorld   = texelFetch(iChannel2, ivec2(iBufWidth - 3, 0), 0).xyz;
    vec3 CamRightWorld = texelFetch(iChannel2, ivec2(iBufWidth - 2, 0), 0).xyz;
    vec3 CamUpWorld    = texelFetch(iChannel2, ivec2(iBufWidth - 1, 0), 0).xyz;
    float iUniverseSign = texelFetch(iChannel2, ivec2(iBufWidth - 6, 0), 0).y;
    
    if (iUniverseSign == 0.0) iUniverseSign = 1.0;
    if (iFrame <= 5||length(CamRightWorld) < 0.01) {
        CamPosWorld =  vec3(-2.0, -3.6, 22.0); 
        vec3 fwd = vec3(0.0, 0.15, -1.0);
        CamRightWorld = normalize(cross(fwd, vec3(-0.5, 1.0, 0.0)));
        CamUpWorld    = normalize(cross(CamRightWorld, fwd));
    }
    vec3 CamBackWorld  = normalize(cross(CamRightWorld, CamUpWorld));
    
    mat3 CamRotMat = mat3(CamRightWorld, CamUpWorld, CamBackWorld);
    mat4 iInverseCamRot = mat4(CamRotMat); 

    vec3 RelPos = transpose(CamRotMat) * (-CamPosWorld);
    vec4 iBlackHoleRelativePosRs = vec4(RelPos, 0.0);
    
    vec3 DiskNormalWorld = vec3(0.0, 1.0, 0.0);
    vec3 DiskTangentWorld = vec3(1.0, 0.0, 0.0);
    
    vec3 RelNormal = transpose(CamRotMat) * DiskNormalWorld;
    vec3 RelTangent = transpose(CamRotMat) * DiskTangentWorld;
    
    vec4 iBlackHoleRelativeDiskNormal = vec4(RelNormal, 0.0);
    vec4 iBlackHoleRelativeDiskTangen = vec4(RelTangent, 0.0);

    vec2 Jitter = vec2(RandomStep(Uv, fract(iTime * 1.0 + 0.5)), 
                       RandomStep(Uv, fract(iTime * 1.0))) / iResolution;

    TraceResult res = TraceRay(Uv + 0.5 * Jitter, iResolution,
                               iInverseCamRot,
                               iBlackHoleRelativePosRs,
                               iBlackHoleRelativeDiskNormal,
                               iBlackHoleRelativeDiskTangen,
                               iUniverseSign);

    vec4 FinalColor    = res.AccumColor;
    float CurrentStatus = res.Status;
    vec3  CurrentDir    = res.EscapeDir;
    float CurrentShift  = res.FreqShift;

    if ( CurrentStatus > 0.5 && CurrentStatus < 2.5) 
    {
        vec4 Bg = SampleBackground(CurrentDir, CurrentShift, CurrentStatus);
        FinalColor += 0.9999 * Bg * vec4(pow((1.0 - FinalColor.a),1.0+0.3*(1.0-1.0)),pow((1.0 - FinalColor.a),1.0+0.3*(3.0-1.0)),pow((1.0 - FinalColor.a),1.0+0.3*(6.0-1.0)),1.0);
    }

    FinalColor = ApplyToneMapping(FinalColor, CurrentShift);

    vec4 PrevColor = vec4(0.0);
    if(iFrame > 0) {
        PrevColor = texelFetch(iHistoryTex, ivec2(FragCoord.xy), 0);
    }
    
    FragColor = (iBlendWeight) * FinalColor + (1.0 - iBlendWeight) * PrevColor;
}

