#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform sampler2D u_offsets;
uniform vec2 u_mouse;
uniform vec2 u_wheel;
uniform float u_time;
in vec2 v_position;
out vec4 color;

const float pi = 3.14159;
const float force = 2.0;
  
void main() {
  float force = 0.0001*u_wheel.y;
  vec2 t = vec2(
    0.5+0.5*v_position.x,
    0.5-0.5*v_position.y
  );
  vec4 p = texture(u_offsets, t);
  vec2 offset = vec2(p.r-u_mouse.x, p.b+u_mouse.y);
  vec2 tt = mod(t+force*offset, 1.0);
  color = texture(u_image, tt);
}
