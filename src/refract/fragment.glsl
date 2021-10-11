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

int maxIterations = 10;
float minDist = 0.001;
float maxDist = 1000.0;

struct Sphere {
    vec3 center;
    float radius;
};

float distSphere(vec3 point, Sphere sphere) {
    return distance(point, sphere.center) - sphere.radius;
}

float marchSphere(vec2 ray, Sphere sphere) {

    float dist = 0.0;
    
    int i = 0;
    float radius = 0.0;
    vec3 current = vec3(0.0, 0.0, 0.0);
    
    while (radius < maxDist && i < maxIterations && dist < maxDist) {
        radius = distSphere(current, sphere);
        dist += radius;
        current += radius * normalize(vec3(ray.x, ray.y, 360.0));
        i++;
        
        if (radius < minDist || i >= maxIterations) {
            return dist;
        }
    }
    
    return 1.0 / 0.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float dist = 1.0 / 0.0;
    dist = min(dist, marchSphere(vec2 fragCoord, Sphere(vec3(0.0, 0.0, 500.0), 100.0)));
    fragColor = vec4(dist == 1.0/0.0 ? vec3(1.0, 0.0, 0.0) : vec3(dist)/maxDist, 1.0);
}
