// Scene-color pass entrypoint.
// Read order: params -> utils -> color -> relativity -> accretion -> main.
#include "./modules/scene-color/params-and-constants.frag"
#include "./modules/scene-color/noise-and-utils.frag"
#include "./modules/scene-color/color-and-post.frag"
#include "./modules/scene-color/relativity-core.frag"
#include "./modules/scene-color/accretion-and-jets.frag"
#include "./modules/scene-color/main.frag"

