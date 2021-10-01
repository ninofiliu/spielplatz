#version 300 es
in vec4 a_position;
out vec2 v_position;
out vec2 v_texCoord;

void main() {
  gl_Position = a_position;
  v_position = 0.5+0.5*vec2(a_position);
}
