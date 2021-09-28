precision mediump float;
uniform vec2 u_mouse;
uniform float u_now;
varying vec4 v_position;

const int nb = 3;

float rand(float seed) {
  // return fract(353185.784*sin(seed));
  return fract(u_now*0.0003*sin(seed));
}
float rand(int xi, int yi) {
  return rand(float(xi+nb*yi));
}
int mod(int a, int b) {
  return int(a - b*(a/b));
}
vec2 get_point(int xi, int yi) {
  return vec2(
    (float(xi)+rand(xi, yi))/float(nb),
    (float(yi)+rand(yi, xi))/float(nb)
  );
}

void main () {
  vec2 current = vec2(v_position);
  current.x = mod(current.x+0.5, 1.0);
  current.y = mod(current.y+0.5, 1.0);
  int xi = int(current.x * float(nb));
  int yi = int(current.y * float(nb));

  float min_dist = 2.0;
  for (int dx = -2; dx < 3; dx++) {
    for (int dy = -2; dy < 3; dy++) {
      int pxi = xi+dx;
      int pxim = mod(pxi, nb);
      int pyi = yi+dy;
      int pyim = mod(pyi, nb);

      vec2 point = get_point(pxim, pyim);
      for (float ddx = -1.0; ddx < 2.0; ddx++) {
        for (float ddy = -1.0; ddy < 2.0; ddy++) {
          vec2 dpoint = point;
          dpoint.x += ddx;
          dpoint.y += ddy;
          float dist = distance(dpoint, current);
          if (dist < min_dist) {
            min_dist = dist;
          }
        }
      }
    }
  }

  float light = 5.0 * 0.63 * atan(min_dist);

  gl_FragColor = vec4(vec3(light), 1.0);
}
