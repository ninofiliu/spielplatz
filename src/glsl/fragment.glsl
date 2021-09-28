precision mediump float;
uniform vec2 u_mouse;
uniform float u_now;
varying vec4 v_position;

float PHI = 1.61803398874989484820459; 

float gold_noise(in vec2 xy, in float seed){
  return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

void main () {
  float light = gold_noise(vec2(v_position), pow(u_now/100.0, 10.0));
  gl_FragColor = vec4(vec3(light), 1.0);
}
