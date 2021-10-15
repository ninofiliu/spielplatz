precision mediump float;
uniform vec2 u_mouse;
uniform float u_now;
varying vec4 v_position;

const int deg = 5;
float zoom = 1.5;
float speed = 0.0001;
const int steps = 20;
float surface = 0.3;

vec2 roots[deg];

struct Closest {
  int i;
  float d;
};

vec2 mul(vec2 a, vec2 b) { return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x); }
vec2 inv(vec2 a) { return vec2(a.x, -a.y) / (a.x*a.x+a.y*a.y); }

vec2 f(vec2 a) {
  vec2 sum = vec2(0.0, 0.0);
  for (int i = 0; i < deg; i++) {
    sum += inv(a-roots[i]);
  }
  return inv(sum);
}

Closest getClosest(vec2 a) {
  Closest closest = Closest(0, distance(a, roots[0]));
  for (int i = 1; i < deg; i++) {
    float d = distance(a, roots[i]);
    if (d < closest.d) {
      closest.i = i;
      closest.d = d;
    }
  }
  return closest;
}

void main () {
  vec2 a = zoom * v_position.xy;

  for (int i = 0; i < deg; i++) {
    float rot = speed * float(i) * u_now;
    roots[i] = vec2(cos(rot), sin(rot));
  }

  vec2 u = a;
  Closest closest;
  for (int i = 0; i < steps; i++) {
    u -= f(u);
    closest = getClosest(u);
    if (closest.d < surface) {
      break;
    }
  }

  gl_FragColor = vec4(vec3(sin(0.05/closest.d)), 1.0);
}
