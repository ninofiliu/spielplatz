precision mediump float;
uniform vec2 u_mouse;
uniform float u_now;
varying vec4 v_position;

const int nb = 5;

int mod(int a, int n) {
  if (a<0) { return a+n; }
  if (a>=n) { return a-n; }
  return a;
}
float rand(float seed) {
  // return fract(353185.784*sin(seed));
  return fract((353.784+u_now*0.0001)*sin(seed));
}
float rand(int xi, int yi) {
  return rand(float(xi+nb*yi));
}
vec2 get_point(int xi, int yi) {
  return vec2(
    (float(xi)+rand(1+xi, yi))/float(nb),
    (float(yi)+rand(1+yi, 2*xi))/float(nb)
  );
}

void main () {
  vec2 current = vec2(v_position);
  current.x = mod(current.x+0.5, 1.0);
  current.y = mod(current.y+0.5, 1.0);
  int xi = int(current.x * float(nb));
  int yi = int(current.y * float(nb));

  float min_dist = 2.0;
  for (int dx = -1; dx < 2; dx++) {
    int pxi = xi + dx;
    if (pxi < 0) { pxi += nb; };
    if (pxi >= nb) { pxi -= nb; };
    for (int dy = -1; dy < 2; dy++) {
      int pyi = yi + dy;
      if (pyi == -1) { pyi = nb - 1; }
      if (pyi == nb) { pyi = 0; }

      vec2 point = get_point(pxi, pyi);
      if (xi==0 && pxi==nb-1) { point.x-=1.0; }
      if (xi==nb-1 && pxi==0) { point.x+=1.0; }
      if (yi==0 && pyi==nb-1) { point.y-=1.0; }
      if (yi==nb-1 && pyi==0) { point.y+=1.0; }
      min_dist = min(min_dist, distance(current, point));
    }
  }

  float light = 5.0 * 0.63 * atan(min_dist);

  gl_FragColor = vec4(vec3(light), 1.0);
  // gl_FragColor.x = (fract(current.x*float(nb)) < 0.1 && fract(current.y*float(nb)) < 0.1) ? 1.0 : 0.0;
  // gl_FragColor.x = (fract(current.x*float(nb)) < 0.01 || fract(current.y*float(nb)) < 0.01) ? 1.0 : 0.0;
}
