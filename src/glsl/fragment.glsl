precision mediump float;
varying vec4 v_position;

float light_circle (
  float x,
  float y,
  float radius,
  float width
) {
  float dist = distance(vec2(x,y), vec2(v_position.x, v_position.y));
  return abs(dist-radius) < width ? 1.0 : 0.0;
}

void main () {
  const int n = 5;
  float light = 0.0;
  for (int x = 0; x < n; x++) {
    for (int y = 0; y < n; y++) {
      light += light_circle(
        -1.0 + 2.0 * float(x) / float(n) + 1.0 / float(n),
        -1.0 + 2.0 * float(y) / float(n) + 1.0 / float(n),
        0.5 / float(n),
        0.001
      );
    }
  }
  gl_FragColor = vec4(vec3(light), 1.0);
}
