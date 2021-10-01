#version 300 es
precision highp float;
uniform sampler2D u_image;
in vec2 v_position;
out vec4 color;
  
void main() {
  color = texture(u_image, vec2(v_position.x, 1.0-v_position.y));
  if (v_position.x>0.9) { color.r = 1.0; }
  if (v_position.y>0.9) { color.g = 1.0; }
}
