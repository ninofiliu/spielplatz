precision mediump float;
uniform vec2 u_mouse;
uniform float u_now;
varying vec4 v_position;

int mod(int a, int n) {
  if (a<0) { return a+n; }
  if (a>=n) { return a-n; }
  return a;
}
float rand(float seed) {
  return fract(353185.784*sin(seed));
}
float rand(int nb, int xi, int yi, int zi) {
  return rand(float(xi+nb*yi+nb*nb*zi));
}
vec3 get_point(int nb, int xi, int yi, int zi) {
  return vec3(
    (float(xi)+rand(nb, 1+xi, yi, zi))/float(nb),
    (float(yi)+rand(nb, 1+xi, yi, 2*zi))/float(nb),
    (float(zi)+rand(nb, 1+xi, yi, 3*zi))/float(nb)
  );
}

float worley(int nb, float speed) {
  vec3 current = vec3(v_position.x, v_position.y, mod(u_now*speed, 1.0));
  current.x = mod(current.x+0.5, 1.0);
  current.y = mod(current.y+0.5, 1.0);
  int xi = int(current.x * float(nb));
  int yi = int(current.y * float(nb));
  int zi = int(current.z * float(nb));

  float min_dist = 2.0;
  for (int dx = -1; dx < 2; dx++) {
    int pxi = mod(xi + dx, nb);
    for (int dy = -1; dy < 2; dy++) {
      int pyi = mod(yi + dy, nb);
      for (int dz = -1; dz < 2; dz++) {
        int pzi = mod(zi + dz, nb);
        vec3 point = get_point(nb, pxi, pyi, pzi);
        if (xi==0 && pxi==nb-1) { point.x-=1.0; }
        if (xi==nb-1 && pxi==0) { point.x+=1.0; }
        if (yi==0 && pyi==nb-1) { point.y-=1.0; }
        if (yi==nb-1 && pyi==0) { point.y+=1.0; }
        if (zi==0 && pzi==nb-1) { point.z-=1.0; }
        if (zi==nb-1 && pzi==0) { point.z+=1.0; }
        min_dist = min(min_dist, distance(current, point));
      }
    }
  }

  return float(nb) * 0.63 * atan(min_dist);

}

void main () {
  float wa = worley(3, 0.0005);
  float wb = worley(6, 0.0004);
  float light = 0.8 * wa + 0.2 * wb;
  gl_FragColor = vec4(vec3(light), 1.0);
}
