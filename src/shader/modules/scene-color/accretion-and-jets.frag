// Volumetric accretion disk, jet lighting, and heat-haze sampling.
float HazeNoise01(vec3 p) {
    return PerlinNoise(p) * 0.5 + 0.5;
}


float GetBaseNoise(vec3 p)
{
    float baseScale = HAZE_SCALE * 0.4; 
    vec3 pos = p * baseScale;
    
    
    const mat3 rotNoise = mat3(
         0.80,  0.60,  0.00,
        -0.48,  0.64,  0.60,
        -0.36,  0.48, -0.80
    );
    pos = rotNoise * pos;

    float n1 = HazeNoise01(pos); 
    float n2 = HazeNoise01(pos * 3.0 + vec3(13.5, -2.4, 4.1));

    return n1 * 0.6 + n2 * 0.4; 
}


float GetDiskHazeMask(vec3 pos_Rg, float InterRadius, float OuterRadius, float Thin, float Hopper)
{
    float r = length(pos_Rg.xz);
    float y = abs(pos_Rg.y);
    
    
    float GeometricThin = Thin + max(0.0, (r - 3.0) * Hopper);
    float diskThickRef = GeometricThin; 
    
    float boundaryY = max(0.2, diskThickRef * HAZE_LAYER_THICKNESS);
    
    float vMaskDisk = 1.0 - smoothstep(boundaryY * 0.5, boundaryY * 1.5, y);
    float rMaskDisk = smoothstep(InterRadius * 0.3, InterRadius * 0.8, r) * 
                      (1.0 - smoothstep(OuterRadius * HAZE_RADIAL_EXPAND * 0.75, OuterRadius * HAZE_RADIAL_EXPAND, r));
    
    return vMaskDisk * rMaskDisk;
}


float GetJetHazeMask(vec3 pos_Rg, float InterRadius, float OuterRadius)
{
    float r = length(pos_Rg.xz);
    float y = abs(pos_Rg.y);
    float RhoSq = r * r;


    float coreRadiusLimit = sqrt(2.0 * InterRadius * InterRadius + 0.03 * 0.03 * y * y);


    float shellRadiusLimit = 1.3 * InterRadius + 0.25 * y;
    
    
    float maxJetRadius = max(coreRadiusLimit, shellRadiusLimit) * 1.2;


    float jLen = OuterRadius * 0.8;
    
    
    float rMaskJet = 1.0 - smoothstep(maxJetRadius * 0.8, maxJetRadius * 1.1, r);
    float hMaskJet = 1.0 - smoothstep(jLen * 0.75, jLen * 1.0, y);


    float startYMask = smoothstep(InterRadius * 0.5, InterRadius * 1.5, y);
    
    return rMaskJet * hMaskJet * startYMask;
}


bool IsInHazeBoundingVolume(vec3 pos, float probeDist, float OuterRadius) {
    float maxR = OuterRadius * 1.2;
    float maxY = maxR; 
    float r = length(pos);
    
    
    if (r > maxR + probeDist) return false;
    return true;
}


vec3 GetHazeForce(vec3 pos_Rg, float time, float PhysicalSpinA, float PhysicalQ, 
                  float InterRadius, float OuterRadius, float Thin, float Hopper,
                  float AccretionRate)
{


    float dDens = HAZE_DISK_DENSITY_REF;
    float dLimitAbs = 20.0;
    float dFactorAbs = clamp((log(dDens/dLimitAbs)) / 2.302585, 0.0, 1.0);
    
    float jDensRef = HAZE_JET_DENSITY_REF; 
    float dFactorRel = 1.0;
    if (jDensRef > 1e-20) dFactorRel = clamp((log(dDens/jDensRef)) / 2.302585, 0.0, 1.0);
    float diskHazeStrength = dFactorAbs * dFactorRel;


    float jetHazeStrength = 0.0;
    float JetThreshold = 1e-2;
    
    
    if (AccretionRate >= JetThreshold)
    {
        
        
        float logRate = log(AccretionRate);
        float logMin  = log(JetThreshold);
        float logMax  = log(1.0);
        
        float intensity = clamp((logRate - logMin) / (logMax - logMin), 0.0, 1.0);
        jetHazeStrength = intensity;
    }

    
    if (diskHazeStrength <= 0.001 && jetHazeStrength <= 0.001) return vec3(0.0);

    vec3 totalForce = vec3(0.0);
    float eps = 0.1;


    float rotSpeedBase = 100.0 * HAZE_ROT_SPEED; 
    float jetSpeedBase = 50.0 * HAZE_FLOW_SPEED;


    float ReferenceOmega = GetKeplerianAngularVelocity(6.0, 1.0, PhysicalSpinA, PhysicalQ);
    
    
    float AdaptiveFrequency = abs(ReferenceOmega * rotSpeedBase) / (2.0 * kPi * 5.14);
    
    
    AdaptiveFrequency = max(AdaptiveFrequency, 0.1);

    float flowTime = time * AdaptiveFrequency;
    
    float phase1 = fract(flowTime);
    float phase2 = fract(flowTime + 0.5);
    
    
    float weight1 = 1.0 - abs(2.0 * phase1 - 1.0);
    float weight2 = 1.0 - abs(2.0 * phase2 - 1.0);
    
    bool doLayer1 = weight1 > 0.05;
    bool doLayer2 = weight2 > 0.05;
    
    float wTotal = (doLayer1 ? weight1 : 0.0) + (doLayer2 ? weight2 : 0.0);
    float w1_norm = (doLayer1 && wTotal > 0.0) ? (weight1 / wTotal) : 0.0;
    float w2_norm = (doLayer2 && wTotal > 0.0) ? (weight2 / wTotal) : 0.0;

    
    float t_offset1 = phase1 - 0.5;
    float t_offset2 = phase2 - 0.5;

    
    float VerticalDrift1 = t_offset1 * 1.0; 
    float VerticalDrift2 = t_offset2 * 1.0;


    if (diskHazeStrength > 0.001)
    {
        float maskDisk = GetDiskHazeMask(pos_Rg, InterRadius, OuterRadius, Thin, Hopper);
        
        if (maskDisk > 0.001)
        {
            float r_local = length(pos_Rg.xz);
            float omega = GetKeplerianAngularVelocity(r_local, 1.0, PhysicalSpinA, PhysicalQ);
            
            vec3 gradWorldCombined = vec3(0.0);
            float valCombined = 0.0;

            if (doLayer1)
            {
                float angle1 = omega * rotSpeedBase * t_offset1;
                float c1 = cos(angle1); float s1 = sin(angle1);
                vec3 pos1 = pos_Rg;
                pos1.x = pos_Rg.x * c1 - pos_Rg.z * s1;
                pos1.z = pos_Rg.x * s1 + pos_Rg.z * c1;
                
                float val1 = GetBaseNoise(pos1);
                float nx1 = GetBaseNoise(pos1 + vec3(eps, 0.0, 0.0));
                float ny1 = GetBaseNoise(pos1 + vec3(0.0, eps, 0.0));
                float nz1 = GetBaseNoise(pos1 + vec3(0.0, 0.0, eps));
                vec3 grad1 = vec3(nx1 - val1, ny1 - val1, nz1 - val1);
                
                vec3 gradWorld1;
                gradWorld1.x = grad1.x * c1 + grad1.z * s1;
                gradWorld1.y = grad1.y;
                gradWorld1.z = -grad1.x * s1 + grad1.z * c1;
                
                gradWorldCombined += gradWorld1 * w1_norm;
                valCombined += val1 * w1_norm;
            }
            
            if (doLayer2)
            {
                float angle2 = omega * rotSpeedBase * t_offset2;
                float c2 = cos(angle2); float s2 = sin(angle2);
                vec3 pos2 = pos_Rg;
                pos2.x = pos_Rg.x * c2 - pos_Rg.z * s2;
                pos2.z = pos_Rg.x * s2 + pos_Rg.z * c2;
                
                float val2 = GetBaseNoise(pos2);
                float nx2 = GetBaseNoise(pos2 + vec3(eps, 0.0, 0.0));
                float ny2 = GetBaseNoise(pos2 + vec3(0.0, eps, 0.0));
                float nz2 = GetBaseNoise(pos2 + vec3(0.0, 0.0, eps));
                vec3 grad2 = vec3(nx2 - val2, ny2 - val2, nz2 - val2);
                
                vec3 gradWorld2;
                gradWorld2.x = grad2.x * c2 + grad2.z * s2;
                gradWorld2.y = grad2.y;
                gradWorld2.z = -grad2.x * s2 + grad2.z * c2;
                
                gradWorldCombined += gradWorld2 * w2_norm;
                valCombined += val2 * w2_norm;
            }
            
            float cloud = max(0.0, valCombined - HAZE_DENSITY_THRESHOLD);
            cloud /= (1.0 - HAZE_DENSITY_THRESHOLD);
            cloud = pow(cloud, 1.5);
            
            totalForce += gradWorldCombined * maskDisk * cloud * diskHazeStrength;
        }
    }


    if (jetHazeStrength > 0.001)
    {
        float maskJet = GetJetHazeMask(pos_Rg, InterRadius, OuterRadius);
        
        if (maskJet > 0.001)
        {
            float v_jet_mag = 0.9; 
            
            float dist1 = v_jet_mag * jetSpeedBase * t_offset1;
            float dist2 = v_jet_mag * jetSpeedBase * t_offset2;
            
            vec3 gradCombined = vec3(0.0);
            float valCombined = 0.0;
            
            if (doLayer1)
            {
                vec3 pos1 = pos_Rg;
                pos1.y -= sign(pos_Rg.y) * dist1;
                float val1 = GetBaseNoise(pos1);
                float nx1 = GetBaseNoise(pos1 + vec3(eps, 0.0, 0.0));
                float ny1 = GetBaseNoise(pos1 + vec3(0.0, eps, 0.0));
                float nz1 = GetBaseNoise(pos1 + vec3(0.0, 0.0, eps));
                vec3 grad1 = vec3(nx1 - val1, ny1 - val1, nz1 - val1);
                gradCombined += grad1 * w1_norm;
                valCombined += val1 * w1_norm;
            }
            
            if (doLayer2)
            {
                vec3 pos2 = pos_Rg;
                pos2.y -= sign(pos_Rg.y) * dist2;
                float val2 = GetBaseNoise(pos2);
                float nx2 = GetBaseNoise(pos2 + vec3(eps, 0.0, 0.0));
                float ny2 = GetBaseNoise(pos2 + vec3(0.0, eps, 0.0));
                float nz2 = GetBaseNoise(pos2 + vec3(0.0, 0.0, eps));
                vec3 grad2 = vec3(nx2 - val2, ny2 - val2, nz2 - val2);
                gradCombined += grad2 * w2_norm;
                valCombined += val2 * w2_norm;
            }
            
            float cloud = max(0.0, valCombined - 0.3-0.7*HAZE_DENSITY_THRESHOLD); 
            cloud /= clamp((1.0 - 0.3-0.7*HAZE_DENSITY_THRESHOLD),0.0,1.0);
            cloud = pow(cloud, 1.5);
            
            totalForce += gradCombined * maskJet * cloud * jetHazeStrength;
        }
    }

    return totalForce;
}

vec4 DiskColor(vec4 BaseColor, float StepLength, vec4 RayPos, vec4 LastRayPos,
               vec3 RayDir, vec3 LastRayDir,vec4 iP_cov, float iE_obs,
               float InterRadius, float OuterRadius, float Thin, float Hopper, float Brightmut, float Darkmut, float Reddening, float Saturation, float DiskTemperatureArgument,
               float BlackbodyIntensityExponent, float RedShiftColorExponent, float RedShiftIntensityExponent,
               float PeakTemperature, float ShiftMax, 
               float PhysicalSpinA, 
               float PhysicalQ,
               float ThetaInShell,
               inout float RayMarchPhase 
               )
{
    vec4 CurrentResult = BaseColor;
    

    float MaxDiskHalfHeight = Thin + max(0.0, Hopper * OuterRadius) + 2.0; 
    if (LastRayPos.y > MaxDiskHalfHeight && RayPos.y > MaxDiskHalfHeight) return BaseColor;
    if (LastRayPos.y < -MaxDiskHalfHeight && RayPos.y < -MaxDiskHalfHeight) return BaseColor;

    vec2 P0 = LastRayPos.xz;
    vec2 P1 = RayPos.xz;
    vec2 V  = P1 - P0;
    float LenSq = dot(V, V);
    float t_closest = (LenSq > 1e-8) ? clamp(-dot(P0, V) / LenSq, 0.0, 1.0) : 0.0;
    vec2 ClosestPoint = P0 + V * t_closest;
    if (dot(ClosestPoint, ClosestPoint) > (OuterRadius * 1.1) * (OuterRadius * 1.1)) return BaseColor;

    vec3 StartPos = LastRayPos.xyz; 
    vec3 DirVec   = RayDir; 
    float StartTimeLag = LastRayPos.w;
    float EndTimeLag   = RayPos.w;

    float R_Start = KerrSchildRadius(StartPos, PhysicalSpinA, 1.0);
    float R_End   = KerrSchildRadius(RayPos.xyz, PhysicalSpinA, 1.0);
    if (max(R_Start, R_End) < InterRadius * 0.9) return BaseColor;

    
    float TotalDist = StepLength;
    float TraveledDist = 0.0;
    
    int SafetyLoopCount = 0;
    const int MaxLoops = 114514; 

    while (TraveledDist < TotalDist && SafetyLoopCount < MaxLoops)
    {
        if (CurrentResult.a > 0.99) break;
        SafetyLoopCount++;

        vec3 CurrentPos = StartPos + DirVec * TraveledDist;
        float DistanceToBlackHole = length(CurrentPos); 
        
        
        float SmallStepBoundary = max(OuterRadius, 12.0);
        float StepSize = 1.0; 
        
        StepSize *= 0.15 + 0.25 * min(max(0.0, 0.5 * (0.5 * DistanceToBlackHole / max(10.0 , SmallStepBoundary) - 1.0)), 1.0);
        if ((DistanceToBlackHole) >= 2.0 * SmallStepBoundary) StepSize *= DistanceToBlackHole;
        else if ((DistanceToBlackHole) >= 1.0 * SmallStepBoundary) StepSize *= ((1.0 + 0.25 * max(DistanceToBlackHole - 12.0, 0.0)) * (2.0 * SmallStepBoundary - DistanceToBlackHole) + DistanceToBlackHole * (DistanceToBlackHole - SmallStepBoundary)) / SmallStepBoundary;
        else StepSize *= min(1.0 + 0.25 * max(DistanceToBlackHole - 12.0, 0.0), DistanceToBlackHole);
        
        StepSize = max(0.01, StepSize); 

        
        float DistToNextSample = RayMarchPhase * StepSize;
        float DistRemainingInRK4 = TotalDist - TraveledDist;

        if (DistToNextSample > DistRemainingInRK4)
        {


            float PhaseProgress = DistRemainingInRK4 / StepSize;
            RayMarchPhase -= PhaseProgress; 
            
            
            if(RayMarchPhase < 0.0) RayMarchPhase = 0.0; 
            
            TraveledDist = TotalDist; 
            break;
        }

        float dt = DistToNextSample;
        
        
        TraveledDist += dt;
        vec3 SamplePos = StartPos + DirVec * TraveledDist;
        
        float TimeInterpolant = min(1.0, TraveledDist / max(1e-9, TotalDist));
        float CurrentRayTimeLag = mix(StartTimeLag, EndTimeLag, TimeInterpolant);
        float EmissionTime = iBlackHoleTime + CurrentRayTimeLag;

        
        vec3 PreviousPos = CurrentPos; 


        float PosR = KerrSchildRadius(SamplePos, PhysicalSpinA, 1.0);
        float PosY = SamplePos.y;
        
        float GeometricThin = Thin + max(0.0, (length(SamplePos.xz) - 3.0) * Hopper);
        
        
        float InterCloudEffectiveRadius = (PosR - InterRadius) / min(OuterRadius - InterRadius, 12.0);
        float InnerCloudBound = max(GeometricThin, Thin * 1.0) * (1.0 - 5.0 * pow(InterCloudEffectiveRadius, 2.0));


        float UnionBound = max(GeometricThin * 1.5, max(0.0, InnerCloudBound));

        if (abs(PosY) < UnionBound && PosR < OuterRadius && PosR > InterRadius)
        {
             float NoiseLevel = max(0.0, 2.0 - 0.6 * GeometricThin);
             float x = (PosR - InterRadius) / max(1e-6, OuterRadius - InterRadius);
             float a_param = max(1.0, (OuterRadius - InterRadius) / 10.0);
             float EffectiveRadius = (-1.0 + sqrt(max(0.0, 1.0 + 4.0 * a_param * a_param * x - 4.0 * x * a_param))) / (2.0 * a_param - 2.0);
             if(a_param == 1.0) EffectiveRadius = x;
             
             float DenAndThiFactor = Shape(EffectiveRadius, 0.9, 1.5);

             float RotPosR_ForThick = PosR + 0.25 / 3.0 * EmissionTime;
             float PosLogTheta_ForThick = Vec2ToTheta(SamplePos.zx, vec2(cos(-2.0 * log(max(1e-6, PosR))), sin(-2.0 * log(max(1e-6, PosR)))));
             float ThickNoise = GenerateAccretionDiskNoise(vec3(1.5 * PosLogTheta_ForThick, RotPosR_ForThick, 0.0), -0.7 + NoiseLevel, 1.3 + NoiseLevel, 80.0);
             
             float PerturbedThickness = max(1e-6, GeometricThin * DenAndThiFactor * (0.4 + 0.6 * clamp(GeometricThin - 0.5, 0.0, 2.5) / 2.5 + (1.0 - (0.4 + 0.6 * clamp(GeometricThin - 0.5, 0.0, 2.5) / 2.5)) * SoftSaturate(ThickNoise)));

             
             if ((abs(PosY) < PerturbedThickness) || (abs(PosY) < InnerCloudBound))
             {
                 float u = sqrt(max(1e-6, PosR));
                 float k_cubed = PhysicalSpinA * 0.70710678;
                 float SpiralTheta;
                 if (abs(k_cubed) < 0.001 * u * u * u) {
                     float inv_u = 1.0 / u; float eps3 = k_cubed * pow(inv_u, 3.0);
                     SpiralTheta = -16.9705627 * inv_u * (1.0 - 0.25 * eps3 + 0.142857 * eps3 * eps3);
                 } else {
                     float k = sign(k_cubed) * pow(abs(k_cubed), 0.33333333);
                     float logTerm = (PosR - k*u + k*k) / max(1e-9, pow(u+k, 2.0));
                     SpiralTheta = (5.6568542 / k) * (0.5 * log(max(1e-9, logTerm)) + 1.7320508 * (atan(2.0*u - k, 1.7320508 * k) - 1.5707963));
                 }
                 float PosTheta = Vec2ToTheta(SamplePos.zx, vec2(cos(-SpiralTheta), sin(-SpiralTheta)));
                 float PosLogarithmicTheta = Vec2ToTheta(SamplePos.zx, vec2(cos(-2.0 * log(max(1e-6, PosR))), sin(-2.0 * log(max(1e-6, PosR)))));
                 
                 float AngularVelocity = GetKeplerianAngularVelocity(max(InterRadius, PosR), 1.0, PhysicalSpinA, PhysicalQ);


                 float inv_r = 1.0 / max(1e-6, PosR);
                 float inv_r2 = inv_r * inv_r;
                 
                 
                 float V_pot = inv_r - (PhysicalQ * PhysicalQ) * inv_r2;
                 
                 
                 float g_tt = -(1.0 - V_pot);
                 float g_tphi = -PhysicalSpinA * V_pot; 
                 float g_phiphi = PosR * PosR + PhysicalSpinA * PhysicalSpinA + PhysicalSpinA * PhysicalSpinA * V_pot;
                 
                 
                 float norm_metric = g_tt + 2.0 * AngularVelocity * g_tphi + AngularVelocity * AngularVelocity * g_phiphi;
                 
                 
                 float min_norm = -0.01; 
                 float u_t = inversesqrt(max(abs(min_norm), -norm_metric));
                 
                 
                 float P_phi = - SamplePos.x * iP_cov.z + SamplePos.z * iP_cov.x;


                 float E_emit = u_t * (iE_obs - AngularVelocity * P_phi);
                 float FreqRatio = 1.0 / max(1e-6, E_emit);


                 float DiskTemperature = pow(DiskTemperatureArgument * pow(1.0 / max(1e-6, PosR), 3.0) * max(1.0 - sqrt(InterRadius / max(1e-6, PosR)), 0.000001), 0.25);
                 float VisionTemperature = DiskTemperature * pow(FreqRatio, RedShiftColorExponent); 
                 float BrightWithoutRedshift = 0.05 * min(OuterRadius / (1000.0), 1000.0 / OuterRadius) + 0.55 / exp(5.0 * EffectiveRadius) * mix(0.2 + 0.8 * abs(DirVec.y), 1.0, clamp(GeometricThin - 0.8, 0.2, 1.0)); 
                 BrightWithoutRedshift *= pow(DiskTemperature / PeakTemperature, BlackbodyIntensityExponent); 
                 
                 float RotPosR = PosR + 0.25 / 3.0 * EmissionTime;
                 float Density = DenAndThiFactor;
                 
                 vec4 SampleColor = vec4(0.0);

                 
                 if (abs(PosY) < PerturbedThickness) 
                 {
                     float Levelmut = 0.91 * log(1.0 + (0.06 / 0.91 * max(0.0, min(1000.0, PosR) - 10.0)));
                     float Conmut = 80.0 * log(1.0 + (0.1 * 0.06 * max(0.0, min(1000000.0, PosR) - 10.0)));
                     
                     SampleColor = vec4(GenerateAccretionDiskNoise(vec3(0.1 * RotPosR, 0.1 * PosY, 0.02 * pow(OuterRadius, 0.7) * PosTheta), NoiseLevel + 2.0 - Levelmut, NoiseLevel + 4.0 - Levelmut, 80.0 - Conmut)); 
                     
                     if(PosTheta + kPi < 0.1 * kPi) {
                         SampleColor *= (PosTheta + kPi) / (0.1 * kPi);
                         SampleColor += (1.0 - ((PosTheta + kPi) / (0.1 * kPi))) * vec4(GenerateAccretionDiskNoise(vec3(0.1 * RotPosR, 0.1 * PosY, 0.02 * pow(OuterRadius, 0.7) * (PosTheta + 2.0 * kPi)), NoiseLevel + 2.0 - Levelmut, NoiseLevel + 4.0 - Levelmut, 80.0 - Conmut));
                     }
                     
                     if(PosR > max(0.15379 * OuterRadius, 0.15379 * 64.0)) {
                         float TimeShiftedRadiusTerm = PosR * (4.65114e-6) - 0.1 / 3.0 * EmissionTime;
                         float Spir = (GenerateAccretionDiskNoise(vec3(0.1 * (TimeShiftedRadiusTerm - 0.08 * OuterRadius * PosLogarithmicTheta), 0.1 * PosY, 0.02 * pow(OuterRadius, 0.7) * PosLogarithmicTheta), NoiseLevel + 2.0 - Levelmut, NoiseLevel + 3.0 - Levelmut, 80.0 - Conmut)); 
                         if(PosLogarithmicTheta + kPi < 0.1 * kPi) {
                             Spir *= (PosLogarithmicTheta + kPi) / (0.1 * kPi);
                             Spir += (1.0 - ((PosLogarithmicTheta + kPi) / (0.1 * kPi))) * (GenerateAccretionDiskNoise(vec3(0.1 * (TimeShiftedRadiusTerm - 0.08 * OuterRadius * (PosLogarithmicTheta + 2.0 * kPi)), 0.1 * PosY, 0.02 * pow(OuterRadius, 0.7) * (PosLogarithmicTheta + 2.0 * kPi)), NoiseLevel + 2.0 - Levelmut, NoiseLevel + 3.0 - Levelmut, 80.0 - Conmut));
                         }
                         SampleColor *= (mix(1.0, clamp(0.7 * Spir * 1.5 - 0.5, 0.0, 3.0), 0.5 + 0.5 * max(-1.0, 1.0 - exp(-1.5 * 0.1 * (100.0 * PosR / max(OuterRadius, 64.0) - 20.0)))));
                     }

                     float VerticalMixFactor = max(0.0, (1.0 - abs(PosY) / PerturbedThickness)); 
                     Density *= 0.7 * VerticalMixFactor * Density;
                     SampleColor.xyz *= Density * 1.4;
                     SampleColor.a *= (Density) * (Density) / 0.3;
                     
                     float RelHeight = clamp(abs(PosY) / PerturbedThickness, 0.0, 1.0);
                     SampleColor.xyz *= max(0.0, (0.2 + 2.0 * sqrt(max(0.0, RelHeight * RelHeight + 0.001))));
                 }

                 SampleColor.xyz *=1.0+    clamp(  iPhotonRingBoost        ,0.0,10.0)  *clamp(0.3*ThetaInShell-0.1,0.0,1.0);
                 VisionTemperature *= 1.0 +clamp( iPhotonRingColorTempBoost,0.0,10.0) * clamp(0.3*ThetaInShell-0.1,0.0,1.0);


                 float InnerAngVel = GetKeplerianAngularVelocity(3.0, 1.0, PhysicalSpinA, PhysicalQ);
                 float InnerCloudTimePhase = kPi / (kPi / max(1e-6, InnerAngVel)) * EmissionTime; 
                 float InnerRotArg = 0.666666 * InnerCloudTimePhase;
                 float PosThetaForInnerCloud = Vec2ToTheta(SamplePos.zx, vec2(cos(InnerRotArg), sin(InnerRotArg)));

                 if (abs(PosY) < InnerCloudBound) 
                 {
                     float DustIntensity = max(1.0 - pow(PosY / (GeometricThin  * max(1.0 - 5.0 * pow(InterCloudEffectiveRadius, 2.0), 0.0001)), 2.0), 0.0);
                     
                     if (DustIntensity > 0.0) {
                        float DustNoise = GenerateAccretionDiskNoise(
                            vec3(1.5 * fract((1.5 * PosThetaForInnerCloud + InnerCloudTimePhase) / 2.0 / kPi) * 2.0 * kPi, PosR, PosY), 
                            0.0, 6.0, 80.0
                        );
                        float DustVal = DustIntensity * DustNoise;
                         
                        float ApproxDiskDirY =  DirVec.y; 
                        SampleColor += 0.02 * vec4(vec3(DustVal), 0.2 * DustVal) * sqrt(max(0.0, 1.0001 - ApproxDiskDirY * ApproxDiskDirY) );
                     }
                 }

                 SampleColor.xyz *= BrightWithoutRedshift * KelvinToRgb(VisionTemperature); 
                 SampleColor.xyz *= min(pow(FreqRatio, RedShiftIntensityExponent), ShiftMax); 
                 SampleColor.xyz *= min(1.0, 1.3 * (OuterRadius - PosR) / (OuterRadius - InterRadius)); 
                 SampleColor.a   *= 0.125;
                 
                 vec4 BoostFactor = max(
                    mix(vec4(5.0 / (max(Thin, 0.2) + (0.0 + Hopper * 0.5) * OuterRadius)), vec4(vec3(0.3 + 0.7 * 5.0 / (Thin + (0.0 + Hopper * 0.5) * OuterRadius)), 1.0), 0.0),
                    mix(vec4(100.0 / OuterRadius), vec4(vec3(0.3 + 0.7 * 100.0 / OuterRadius), 1.0), exp(-pow(20.0 * PosR / OuterRadius, 2.0)))
                 );
                 SampleColor *= BoostFactor;
                 SampleColor.xyz *= mix(1.0, max(1.0, abs(DirVec.y) / 0.2), clamp(0.3 - 0.6 * (PerturbedThickness / max(1e-6, Density) - 1.0), 0.0, 0.3));
                 SampleColor.xyz *=1.0+1.2*max(0.0,max(0.0,min(1.0,3.0-2.0*Thin))*min(0.5,1.0-5.0*Hopper));
                 SampleColor.xyz *= Brightmut*clamp(4.0-18.0*(PosR-InterRadius)/(OuterRadius - InterRadius),1.0,4.0);
                 SampleColor.a   *= Darkmut*clamp(5.0-24.0*(PosR-InterRadius)/(OuterRadius - InterRadius),1.0,5.0);
                 
                 vec4 StepColor = SampleColor * dt;
                 
                 float aR = 1.0 + Reddening * (1.0 - 1.0);
                 float aG = 1.0 + Reddening * (3.0 - 1.0);
                 float aB = 1.0 + Reddening * (6.0 - 1.0);
                 
                 float Sum_rgb = (StepColor.r + StepColor.g + StepColor.b) * pow(1.0 - CurrentResult.a, aG);
                 Sum_rgb *= 1.0;
                 
                 float r001 = 0.0;
                 float g001 = 0.0;
                 float b001 = 0.0;
                     
                 float Denominator = StepColor.r*pow(1.0 - CurrentResult.a, aR) + StepColor.g*pow(1.0 - CurrentResult.a, aG) + StepColor.b*pow(1.0 - CurrentResult.a, aB);
                 
                 if (Denominator > 0.000001)
                 {
                     r001 = Sum_rgb * StepColor.r * pow(1.0 - CurrentResult.a, aR) / Denominator;
                     g001 = Sum_rgb * StepColor.g * pow(1.0 - CurrentResult.a, aG) / Denominator;
                     b001 = Sum_rgb * StepColor.b * pow(1.0 - CurrentResult.a, aB) / Denominator;
                     
                    r001 *= pow(3.0*r001/(r001+g001+b001), Saturation);
                    g001 *= pow(3.0*g001/(r001+g001+b001), Saturation);
                    b001 *= pow(3.0*b001/(r001+g001+b001), Saturation);
                 }
                 
                 CurrentResult.r = CurrentResult.r + r001;
                 CurrentResult.g = CurrentResult.g + g001;
                 CurrentResult.b = CurrentResult.b + b001;
                 CurrentResult.a = CurrentResult.a + StepColor.a * pow((1.0 - CurrentResult.a), 1.0);

            }
        }
        RayMarchPhase = 1.0;
    }
    
    return CurrentResult;
}
vec4 JetColor(vec4 BaseColor, float StepLength, vec4 RayPos, vec4 LastRayPos,
              vec3 RayDir, vec3 LastRayDir,vec4 iP_cov, float iE_obs,
              float InterRadius, float OuterRadius, float JetRedShiftIntensityExponent, float JetBrightmut, float JetReddening, float JetSaturation, float AccretionRate, float JetShiftMax, 
              float PhysicalSpinA, 
              float PhysicalQ    
              ) 
{
    vec4 CurrentResult = BaseColor;
    vec3 StartPos = LastRayPos.xyz; 
    vec3 DirVec   = RayDir; 
    
    if (any(isnan(StartPos)) || any(isinf(StartPos))) return BaseColor;

    float StartTimeLag = LastRayPos.w;
    float EndTimeLag   = RayPos.w;

    float TotalDist = StepLength;
    float TraveledDist = 0.0;
    
    float R_Start = length(StartPos.xz);
    float R_End   = length(RayPos.xyz); 
    float MaxR_XZ = max(R_Start, R_End);
    float MaxY    = max(abs(StartPos.y), abs(RayPos.y));
    
    if (MaxR_XZ > OuterRadius * 1.5 && MaxY < OuterRadius) return BaseColor;

    int MaxSubSteps = 32; 
    
    for (int i = 0; i < MaxSubSteps; i++)
    {
        if (TraveledDist >= TotalDist) break;

        vec3 CurrentPos = StartPos + DirVec * TraveledDist;
        
        float TimeInterpolant = min(1.0, TraveledDist / max(1e-9, TotalDist));
        float CurrentRayTimeLag = mix(StartTimeLag, EndTimeLag, TimeInterpolant);
        float EmissionTime = iBlackHoleTime + CurrentRayTimeLag;

        float DistanceToBlackHole = length(CurrentPos); 
        float SmallStepBoundary = max(OuterRadius, 12.0);
        float StepSize = 1.0; 
        
        StepSize *= 0.15 + 0.25 * min(max(0.0, 0.5 * (0.5 * DistanceToBlackHole / max(10.0 , SmallStepBoundary) - 1.0)), 1.0);
        if ((DistanceToBlackHole) >= 2.0 * SmallStepBoundary) StepSize *= DistanceToBlackHole;
        else if ((DistanceToBlackHole) >= 1.0 * SmallStepBoundary) StepSize *= ((1.0 + 0.25 * max(DistanceToBlackHole - 12.0, 0.0)) * (2.0 * SmallStepBoundary - DistanceToBlackHole) + DistanceToBlackHole * (DistanceToBlackHole - SmallStepBoundary)) / SmallStepBoundary;
        else StepSize *= min(1.0 + 0.25 * max(DistanceToBlackHole - 12.0, 0.0), DistanceToBlackHole);
        
        float dt = min(StepSize, TotalDist - TraveledDist);
        float Dither = RandomStep(10000.0 * (RayPos.zx / max(1e-6, OuterRadius)), iTime * 4.0 + float(i) * 0.1337);
        vec3 SamplePos = CurrentPos + DirVec * dt * Dither;
        
        float PosR = KerrSchildRadius(SamplePos, PhysicalSpinA, 1.0);
        float PosY = SamplePos.y;
        float RhoSq = dot(SamplePos.xz, SamplePos.xz);
        float Rho = sqrt(RhoSq);
        
        vec4 AccumColor = vec4(0.0);
        bool InJet = false;

        if (RhoSq < 2.0 * InterRadius * InterRadius + 0.03 * 0.03 * PosY * PosY && PosR < sqrt(2.0) * OuterRadius)
        {
            InJet = true;
            float Shape = 1.0 / sqrt(max(1e-9, InterRadius * InterRadius + 0.02 * 0.02 * PosY * PosY));
            
            float noiseInput = 0.3 * (EmissionTime - 1.0 / 0.8 * abs(abs(PosY) + 100.0 * (RhoSq / max(0.1, PosR)))) / max(1e-6, (OuterRadius / 100.0)) / (1.0 / 0.8);
            float a = mix(0.7 + 0.3 * PerlinNoise1D(noiseInput), 1.0, exp(-0.01 * 0.01 * PosY * PosY));
            
            vec4 Col = vec4(1.0, 1.0, 1.0, 0.5) * max(0.0, 1.0 - 5.0 * Shape * abs(1.0 - pow(Rho * Shape, 2.0))) * Shape;
            Col *= a;
            Col *= max(0.0, 1.0 - 1.0 * exp(-0.0001 * PosY / max(1e-6, InterRadius) * PosY / max(1e-6, InterRadius)));
            Col *= exp(-4.0 / (2.0) * PosR / max(1e-6, OuterRadius) * PosR / max(1e-6, OuterRadius));
            Col *= 0.5;
            AccumColor += Col;
        }

        float Wid = abs(PosY);
        if (Rho < 1.3 * InterRadius + 0.25 * Wid && Rho > 0.7 * InterRadius + 0.15 * Wid && PosR < 30.0 * InterRadius)
        {
            InJet = true;
            float InnerTheta = 2.0 * GetKeplerianAngularVelocity(InterRadius, 1.0, PhysicalSpinA, PhysicalQ) * (EmissionTime - 1.0 / 0.8 * abs(PosY));
            float Shape = 1.0 / max(1e-9, (InterRadius + 0.2 * Wid));
            
            float Twist = 0.2 * (1.1 - exp(-0.1 * 0.1 * PosY * PosY)) * (PerlinNoise1D(0.35 * (EmissionTime - 1.0 / 0.8 * abs(PosY)) / (1.0 / 0.8)) - 0.5);
            vec2 TwistedPos = SamplePos.xz + Twist * vec2(cos(0.666666 * InnerTheta), -sin(0.666666 * InnerTheta));
            
            vec4 Col = vec4(1.0, 1.0, 1.0, 0.5) * max(0.0, 1.0 - 2.0 * abs(1.0 - pow(length(TwistedPos) * Shape, 2.0))) * Shape;
            Col *= 1.0 - exp(-PosY / max(1e-6, InterRadius) * PosY / max(1e-6, InterRadius));
            Col *= exp(-0.005 * PosY / max(1e-6, InterRadius) * PosY / max(1e-6, InterRadius));
            Col *= 0.5;
            AccumColor += Col;
        }

        if (InJet)
        {
            vec3  JetVelDir = vec3(0.0, sign(PosY), 0.0);
            vec3 RotVelDir = normalize(vec3(SamplePos.z, 0.0, -SamplePos.x));
            vec3 FinalSpatialVel = JetVelDir * 0.9 + RotVelDir * 0.05; 
            
            vec4 U_jet_unnorm = vec4(FinalSpatialVel, 1.0);
            KerrGeometry geo_sample;
            ComputeGeometryScalars(SamplePos, PhysicalSpinA, PhysicalQ, 1.0, 1.0, geo_sample);
            vec4 U_fluid_lower = LowerIndex(U_jet_unnorm, geo_sample);
            float norm_sq = dot(U_jet_unnorm, U_fluid_lower);
            vec4 U_jet = U_jet_unnorm * inversesqrt(max(1e-6, abs(norm_sq)));
            
            float E_emit = -dot(iP_cov, U_jet);
            float FreqRatio = 1.0/max(1e-6, E_emit);

            float JetTemperature = 100000.0 * FreqRatio; 
            AccumColor.xyz *= KelvinToRgb(JetTemperature);
            AccumColor.xyz *= min(pow(FreqRatio, JetRedShiftIntensityExponent), JetShiftMax);
            
            AccumColor *= JetBrightmut * (0.5 + 0.5 * tanh(log(max(1e-6, AccretionRate)) + 1.0));
            AccumColor.a *= 0.0; 


                 float aR = 1.0+ JetReddening*(1.0-1.0);
                 float aG = 1.0+ JetReddening*(3.0-1.0);
                 float aB = 1.0+ JetReddening*(6.0-1.0);
                 float Sum_rgb = (AccumColor.r + AccumColor.g + AccumColor.b)*pow(1.0 - CurrentResult.a, aG);
                 Sum_rgb *= 1.0;
                 
                 float r001 = 0.0;
                 float g001 = 0.0;
                 float b001 = 0.0;
                     
                 float Denominator = AccumColor.r*pow(1.0 - CurrentResult.a, aR) + AccumColor.g*pow(1.0 - CurrentResult.a, aG) + AccumColor.b*pow(1.0 - CurrentResult.a, aB);
                 if (Denominator > 0.000001)
                 {
                     r001 = Sum_rgb * AccumColor.r * pow(1.0 - CurrentResult.a, aR) / Denominator;
                     g001 = Sum_rgb * AccumColor.g * pow(1.0 - CurrentResult.a, aG) / Denominator;
                     b001 = Sum_rgb * AccumColor.b * pow(1.0 - CurrentResult.a, aB) / Denominator;
                     
                    r001 *= pow(3.0*r001/(r001+g001+b001),JetSaturation);
                    g001 *= pow(3.0*g001/(r001+g001+b001),JetSaturation);
                    b001 *= pow(3.0*b001/(r001+g001+b001),JetSaturation);
                     
                 }
                 
                 CurrentResult.r=CurrentResult.r + r001;
                 CurrentResult.g=CurrentResult.g + g001;
                 CurrentResult.b=CurrentResult.b + b001;
                 CurrentResult.a=CurrentResult.a + AccumColor.a * pow((1.0 - CurrentResult.a),1.0);
        }
        TraveledDist += dt;
    }
    return CurrentResult;
}


vec4 GridColor(vec4 BaseColor, vec4 RayPos, vec4 LastRayPos,
               vec4 iP_cov, float iE_obs,
               float PhysicalSpinA, float PhysicalQ,
               float EndStepSign) 
{
    vec4 CurrentResult = BaseColor;
    if (CurrentResult.a > 0.99) return CurrentResult;

    const int MaxGrids = 12; 
    float SignedGridRadii[MaxGrids]; 
    int GridCount = 0;
    
    float StartStepSign = EndStepSign;
    bool bHasCrossed = false;
    float t_cross = -1.0;
    vec3 DiskHitPos = vec3(0.0);
    
    if (LastRayPos.y * RayPos.y < 0.0) {
        float denom = (LastRayPos.y - RayPos.y);
        if(abs(denom) > 1e-9) {
            t_cross = LastRayPos.y / denom;
            DiskHitPos = mix(LastRayPos.xyz, RayPos.xyz, t_cross);
            
            if (length(DiskHitPos.xz) < abs(PhysicalSpinA)) {
                StartStepSign = -EndStepSign;
                bHasCrossed = true;
            }
        }
    }

    bool CheckPositive = (StartStepSign > 0.0) || (EndStepSign > 0.0);
    bool CheckNegative = (StartStepSign < 0.0) || (EndStepSign < 0.0);

    float HorizonDiscrim = 0.25 - PhysicalSpinA * PhysicalSpinA - PhysicalQ * PhysicalQ;
    float RH_Outer = 0.5 + sqrt(max(0.0, HorizonDiscrim));
    float RH_Inner = 0.5 - sqrt(max(0.0, HorizonDiscrim));

    if (CheckPositive) {
        SignedGridRadii[GridCount++] = RH_Outer * 1.05; 
        SignedGridRadii[GridCount++] = 20.0;
        
        if (HorizonDiscrim >= 0.0) {
           SignedGridRadii[GridCount++] = RH_Inner * 0.95; 
        }
    }
    
    if (CheckNegative) {
        SignedGridRadii[GridCount++] = -3.0;  
        SignedGridRadii[GridCount++] = -10.0; 
    }

    vec3 O = LastRayPos.xyz;
    vec3 D_vec = RayPos.xyz - LastRayPos.xyz;

    for (int i = 0; i < GridCount; i++) {
        if (CurrentResult.a > 0.99) break;

        float TargetSignedR = SignedGridRadii[i];
        float TargetGeoR = abs(TargetSignedR); 

        vec2 roots = IntersectKerrEllipsoid(O, D_vec, TargetGeoR, PhysicalSpinA);
        
        float t_hits[2];
        t_hits[0] = roots.x;
        t_hits[1] = roots.y;
        
        if (t_hits[0] > t_hits[1]) {
            float temp = t_hits[0]; t_hits[0] = t_hits[1]; t_hits[1] = temp;
        }
        
        for (int j = 0; j < 2; j++) {
            float t = t_hits[j];
            
            if (t >= 0.0 && t <= 1.0) {
                
                float HitPointSign = StartStepSign;
                if (bHasCrossed) {
                    if (t > t_cross) {
                        HitPointSign = EndStepSign;
                    }
                }

                if (HitPointSign * TargetSignedR < 0.0) continue;

                vec3 HitPos = O + D_vec * t;
                float CheckR = KerrSchildRadius(HitPos, PhysicalSpinA, HitPointSign);
                if (abs(CheckR - TargetSignedR) > 0.1 * TargetGeoR + 0.1) continue; 

                
                float Omega = GetZamoOmega(TargetSignedR, PhysicalSpinA, PhysicalQ, HitPos.y);
                vec3 VelSpatial = Omega * vec3(HitPos.z, 0.0, -HitPos.x);
                vec4 U_zamo_unnorm = vec4(VelSpatial, 1.0); 
                
                KerrGeometry geo_hit;
                ComputeGeometryScalars(HitPos, PhysicalSpinA, PhysicalQ, 1.0, HitPointSign, geo_hit);
                
                vec4 U_zamo_lower = LowerIndex(U_zamo_unnorm, geo_hit);
                float norm_sq = dot(U_zamo_unnorm, U_zamo_lower);
                float norm = sqrt(max(1e-9, abs(norm_sq)));
                vec4 U_zamo = U_zamo_unnorm / norm;

                float E_emit = -dot(iP_cov, U_zamo);
                float Shift = 1.0/ max(1e-6, abs(E_emit)); 

                
                float Phi = Vec2ToTheta(normalize(HitPos.zx), vec2(0.0, 1.0));
                float CosTheta = clamp(HitPos.y / TargetGeoR, -1.0, 1.0);
                float Theta = acos(CosTheta);
                float SinTheta = sqrt(max(0.0, 1.0 - CosTheta * CosTheta));

                float DensityPhi = 24.0;
                float DensityTheta = 12.0;
                float DistFactor = length(HitPos);
                float LineWidth = 0.001 * DistFactor;
                LineWidth = clamp(LineWidth, 0.01, 0.1); 

                float PatternPhi = abs(fract(Phi / (2.0 * kPi) * DensityPhi) - 0.5);
                float GridPhi = smoothstep(LineWidth / max(0.005, SinTheta), 0.0, PatternPhi);

                float PatternTheta = abs(fract(Theta / kPi * DensityTheta) - 0.5);
                float GridTheta = smoothstep(LineWidth, 0.0, PatternTheta);
                
                float GridIntensity = max(GridPhi, GridTheta);

                if (GridIntensity > 0.01) {
                    
                    float BaseTemp = 6500.0;
                    vec3 BlackbodyColor = KelvinToRgb(BaseTemp * Shift);
                    float Intensity = min(1.5 * pow(Shift, 4.0), 20.0);
                    vec4 GridCol = vec4(BlackbodyColor * Intensity, 1.0);
                    
                    float Alpha = GridIntensity * 0.5; 
                    CurrentResult.rgb += GridCol.rgb * Alpha * (1.0 - CurrentResult.a);
                    CurrentResult.a   += Alpha * (1.0 - CurrentResult.a);
                }
            }
        }
    }

    
    if (bHasCrossed && CurrentResult.a < 0.99) {
        
        
        float HitRho = length(DiskHitPos.xz);
        float a_abs = abs(PhysicalSpinA);
        
        float Phi = Vec2ToTheta(normalize(DiskHitPos.zx), vec2(0.0, 1.0));
        
        float DensityPhi = 24.0;
        float DistFactor = length(DiskHitPos); 
        float LineWidth = 0.001 * DistFactor;
        LineWidth = clamp(LineWidth, 0.01, 0.1);

        float PatternPhi = abs(fract(Phi / (2.0 * kPi) * DensityPhi) - 0.5);
        float GridPhi = smoothstep(LineWidth / max(0.1, HitRho / a_abs), 0.0, PatternPhi);

        float NormalizedRho = HitRho / max(1e-6, a_abs);
        float DensityRho = 5.0; 
        float PatternRho = abs(fract(NormalizedRho * DensityRho) - 0.5);
        float GridRho = smoothstep(LineWidth, 0.0, PatternRho);
        
        float GridIntensity = max(GridPhi, GridRho);


        if (GridIntensity > 0.01) {
            float Omega0 = 0.0; 
            
            vec3 VelSpatial = vec3(0.0); 
            vec4 U_zero = vec4(0.0, 0.0, 0.0, 1.0); 
            
            float E_emit = -dot(iP_cov, U_zero); 
            float Shift = 1.0 / max(1e-6, abs(E_emit));
            
            float BaseTemp = 6500.0; 
            vec3 BlackbodyColor = KelvinToRgb(BaseTemp * Shift);
            float Intensity = min(2.0 * pow(Shift, 4.0), 30.0);
            
            vec4 GridCol = vec4(BlackbodyColor * Intensity, 1.0);
            
            float Alpha = GridIntensity * 0.5;
            CurrentResult.rgb += GridCol.rgb * Alpha * (1.0 - CurrentResult.a);
            CurrentResult.a   += Alpha * (1.0 - CurrentResult.a);
        }
    }

    return CurrentResult;
}


vec4 GridColorSimple(vec4 BaseColor, vec4 RayPos, vec4 LastRayPos,
               float PhysicalSpinA, float PhysicalQ,
               float EndStepSign) 
{
    vec4 CurrentResult = BaseColor;
    if (CurrentResult.a > 0.99) return CurrentResult;

    const int MaxGrids = 5; 
    
    float SignedGridRadii[MaxGrids]; 
    vec3  GridColors[MaxGrids];
    int   GridCount = 0;
    
    float StartStepSign = EndStepSign;
    bool bHasCrossed = false;
    float t_cross = -1.0;
    vec3 DiskHitPos = vec3(0.0);
    
    if (LastRayPos.y * RayPos.y < 0.0) {
        float denom = (LastRayPos.y - RayPos.y);
        if(abs(denom) > 1e-9) {
            t_cross = LastRayPos.y / denom;
            DiskHitPos = mix(LastRayPos.xyz, RayPos.xyz, t_cross);
            
            if (length(DiskHitPos.xz) < abs(PhysicalSpinA)) {
                StartStepSign = -EndStepSign;
                bHasCrossed = true;
            }
        }
    }

    bool CheckPositive = (StartStepSign > 0.0) || (EndStepSign > 0.0);
    bool CheckNegative = (StartStepSign < 0.0) || (EndStepSign < 0.0);

    float HorizonDiscrim = 0.25 - PhysicalSpinA * PhysicalSpinA - PhysicalQ * PhysicalQ;
    float RH_Outer = 0.5 + sqrt(max(0.0, HorizonDiscrim));
    float RH_Inner = 0.5 - sqrt(max(0.0, HorizonDiscrim));
    bool HasHorizon = HorizonDiscrim >= 0.0;

    if (CheckPositive) {
        SignedGridRadii[GridCount] = 20.0;
        GridColors[GridCount] = 0.3*vec3(0.0, 1.0, 1.0); 
        GridCount++;

        if (HasHorizon) {
            SignedGridRadii[GridCount] = RH_Outer * 1.01 + 0.05; 
            GridColors[GridCount] = 0.3*vec3(0.0, 1.0, 0.0); 
            GridCount++;
            
            SignedGridRadii[GridCount] = RH_Inner * 0.99 - 0.05; 
            GridColors[GridCount] =0.3* vec3(1.0, 0.0, 0.0); 
            GridCount++;
        }
    }
    
    if (CheckNegative) {
        SignedGridRadii[GridCount] = -20.0;  
        GridColors[GridCount] = 0.3*vec3(1.0, 0.0, 1.0); 
        GridCount++;
    }

    vec3 O = LastRayPos.xyz;
    vec3 D_vec = RayPos.xyz - LastRayPos.xyz;

    for (int i = 0; i < GridCount; i++) {
        if (CurrentResult.a > 0.99) break;

        float TargetSignedR = SignedGridRadii[i];
        float TargetGeoR = abs(TargetSignedR); 
        vec3  TargetColor = GridColors[i];

        vec2 roots = IntersectKerrEllipsoid(O, D_vec, TargetGeoR, PhysicalSpinA);
        
        float t_hits[2];
        t_hits[0] = roots.x;
        t_hits[1] = roots.y;
        if (t_hits[0] > t_hits[1]) {
            float temp = t_hits[0]; t_hits[0] = t_hits[1]; t_hits[1] = temp;
        }
        
        for (int j = 0; j < 2; j++) {
            float t = t_hits[j];
            
            if (t >= 0.0 && t <= 1.0) {
                
                float HitPointSign = StartStepSign;
                if (bHasCrossed) {
                    if (t > t_cross) {
                        HitPointSign = EndStepSign;
                    }
                }

                if (HitPointSign * TargetSignedR < 0.0) continue;

                vec3 HitPos = O + D_vec * t;
                
                float CheckR = KerrSchildRadius(HitPos, PhysicalSpinA, HitPointSign);
                if (abs(CheckR - TargetSignedR) > 0.1 * TargetGeoR + 0.1) continue; 

                float Phi = Vec2ToTheta(normalize(HitPos.zx), vec2(0.0, 1.0));
                float CosTheta = clamp(HitPos.y / TargetGeoR, -1.0, 1.0);
                float Theta = acos(CosTheta);
                float SinTheta = sqrt(max(0.0, 1.0 - CosTheta * CosTheta));

                float DensityPhi = 24.0;
                float DensityTheta = 12.0;
                float DistFactor = length(HitPos);
                float LineWidth = 0.002 * DistFactor; 
                LineWidth = clamp(LineWidth, 0.01, 0.15); 

                float PatternPhi = abs(fract(Phi / (2.0 * kPi) * DensityPhi) - 0.5);
                float GridPhi = smoothstep(LineWidth / max(0.005, SinTheta), 0.0, PatternPhi);

                float PatternTheta = abs(fract(Theta / kPi * DensityTheta) - 0.5);
                float GridTheta = smoothstep(LineWidth, 0.0, PatternTheta);
                
                float GridIntensity = max(GridPhi, GridTheta);

                if (GridIntensity > 0.01) {
                    vec4 GridCol = vec4(TargetColor * 2.0, 1.0);
                    
                    float Alpha = GridIntensity * 0.8; 
                    CurrentResult.rgb += GridCol.rgb * Alpha * (1.0 - CurrentResult.a);
                    CurrentResult.a   += Alpha * (1.0 - CurrentResult.a);
                }
            }
        }
    }

    if (bHasCrossed && CurrentResult.a < 0.99) {
        
        float HitRho = length(DiskHitPos.xz);
        float a_abs = abs(PhysicalSpinA);
        
        float Phi = Vec2ToTheta(normalize(DiskHitPos.zx), vec2(0.0, 1.0));
        
        float DensityPhi = 24.0;
        float DistFactor = length(DiskHitPos); 
        float LineWidth = 0.002 * DistFactor;
        LineWidth = clamp(LineWidth, 0.01, 0.1);

        float PatternPhi = abs(fract(Phi / (2.0 * kPi) * DensityPhi) - 0.5);
        float GridPhi = smoothstep(LineWidth / max(0.1, HitRho / a_abs), 0.0, PatternPhi);

        float NormalizedRho = HitRho / max(1e-6, a_abs);
        float DensityRho = 5.0; 
        float PatternRho = abs(fract(NormalizedRho * DensityRho) - 0.5);
        float GridRho = smoothstep(LineWidth, 0.0, PatternRho);
        
        float GridIntensity = max(GridPhi, GridRho);

        if (GridIntensity > 0.01) {
            vec3 RingColor = 0.3*vec3(1.0, 1.0, 1.0);
            vec4 GridCol = vec4(RingColor * 5.0, 1.0);
            
            float Alpha = GridIntensity * 0.8;
            CurrentResult.rgb += GridCol.rgb * Alpha * (1.0 - CurrentResult.a);
            CurrentResult.a   += Alpha * (1.0 - CurrentResult.a);
        }
    }

    return CurrentResult;
}

