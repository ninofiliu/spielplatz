#version 300 es
precision highp float;
uniform sampler2D u_image_0;
uniform sampler2D u_image_1;
uniform float u_mix_src;
uniform sampler2D u_offsets_0;
uniform sampler2D u_offsets_1;
uniform float u_mix_dst;
uniform vec2 u_offset;
uniform float u_force;
uniform float u_time;
in vec2 v_position;
out vec4 color;
  
void main() {
  vec2 t = vec2(
    0.5 + 0.5 * v_position.x,
    0.5 - 0.5 * v_position.y
  );
  vec4 p = mix(
    texture(u_offsets_0, t),
    texture(u_offsets_1, t),
    u_mix_dst
  );
  vec2 offset = vec2(
    p.r - u_offset.x + u_time * 0.1,
    p.b + u_offset.y
  );
  vec2 tt = mod(t + u_force * offset, 1.0);
  color = mix(
    texture(u_image_0, tt),
    texture(u_image_1, tt),
    u_mix_src
  );
}
