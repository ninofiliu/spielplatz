precision mediump float;
uniform vec2 u_mouse;
uniform float u_now;
varying vec4 v_position;

const int nb = 5;

float rand(float seed) {
  return fract(153185.784*sin(seed));
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
  int xi = int(v_position.x * float(nb));
  int yi = int(v_position.y * float(nb));

  float min_dist = 2.0;
  for (int dx = -1; dx < 2; dx++) {
    for (int dy = -1; dy < 2; dy++) {
      int pxi = xi+dx;
      int pxim = mod(pxi, nb);
      int pyi = yi+dy;
      int pyim = mod(pyi, nb);

      vec2 point = get_point(pxim, pyim);
      float dist = distance(point, vec2(v_position));
      if (dist < min_dist) {
        min_dist = dist;
      }
    }
  }

  float light = 10.0 * 0.63 * atan(min_dist);

  gl_FragColor = vec4(vec3(light), 1.0);
}
