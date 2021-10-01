#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform sampler2D u_offsets;
in vec2 v_position;
out vec4 color;

const float pi = 3.14159;
const float force = 2.0;
  
void main() {
  vec2 t = vec2(
    0.5+0.5*v_position.x,
    0.5-0.5*v_position.y
  );
  vec4 p = texture(u_offsets, t);
  vec2 offset = vec2(
    cos(0.0)*p.r + cos(2.0*pi/3.0)*p.g + cos(4.0*pi/3.0)*p.b,
    sin(0.0)*p.r + sin(2.0*pi/3.0)*p.g + sin(4.0*pi/3.0)*p.b
  );
  vec2 tt = mod(t+force*offset, 1.0);
  color = texture(u_image, tt);
}
