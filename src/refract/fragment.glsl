#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform sampler2D u_offsets;
in vec2 v_position;
out vec4 color;
  
void main() {
  vec2 t = vec2(
    0.5+0.5*v_position.x,
    0.5-0.5*v_position.y
  );
  // color = texture(u_image, t);
  color = vec4(vec3(texture(u_offsets, t).x), 1.0);
}
