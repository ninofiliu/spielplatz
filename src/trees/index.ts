type Cart = {
  x: number;
  y: number;
};

type Polar = {
  r: number;
  t: number;
};

type Leaf = {
  pos: Cart;
  vel: Polar;
  children: Leaf[];
};

const tortion = 0.3;
const splitProb = 0.04;
const splitAngle = 0.1;

const tree: Leaf[] = [
  {
    pos: { x: 0, y: 0 },
    vel: { r: 1, t: Math.PI / 2 },
    children: [],
  },
];
const leaves = new Set([tree[0]]);

const dims = { x: window.innerWidth, y: window.innerHeight };
const canvas = document.createElement("canvas");
canvas.width = dims.x;
canvas.height = dims.y;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.append(canvas);
const ctx = canvas.getContext("2d");

const canvasPos = (pos: Cart) =>
  [0.5 * dims.x + 5 * pos.x, dims.y - 5 * pos.y] as const;

const addLeaves = (branch: Leaf, newLeaves: Leaf[]) => {
  for (const newLeaf of newLeaves) {
    branch.children.push(newLeaf);
    tree.push(newLeaf);
    ctx.moveTo(...canvasPos(branch.pos));
    ctx.lineTo(...canvasPos(newLeaf.pos));
    ctx.stroke();
  }
};

{
  ctx.lineWidth = 1;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, dims.x, dims.y);
  ctx.strokeStyle = "white";

  const animate = () => {
    console.log(leaves.size);
    if (leaves.size === 0) return;
    const toAdd = new Set<Leaf>();
    for (const leaf of leaves) {
      if (leaf.vel.r > 0.2) {
        if (Math.random() < splitProb) {
          const leftVelT = leaf.vel.t - splitAngle;
          const rightVelT = leaf.vel.t + splitAngle;
          const leftLeaf: Leaf = {
            pos: {
              x: leaf.pos.x + leaf.vel.r * Math.cos(leftVelT),
              y: leaf.pos.y + leaf.vel.r * Math.sin(leftVelT),
            },
            vel: {
              r: leaf.vel.r * 0.8,
              t: leftVelT,
            },
            children: [],
          };
          const rightLeaf: Leaf = {
            pos: {
              x: leaf.pos.x + leaf.vel.r * Math.cos(rightVelT),
              y: leaf.pos.y + leaf.vel.r * Math.sin(rightVelT),
            },
            vel: {
              r: leaf.vel.r * 0.8,
              t: rightVelT,
            },
            children: [],
          };
          addLeaves(leaf, [leftLeaf, rightLeaf]);
          toAdd.add(leftLeaf);
          toAdd.add(rightLeaf);
        } else {
          const newLeaf: Leaf = {
            pos: {
              x: leaf.pos.x + leaf.vel.r * Math.cos(leaf.vel.t),
              y: leaf.pos.y + leaf.vel.r * Math.sin(leaf.vel.t),
            },
            vel: {
              r: leaf.vel.r,
              t: leaf.vel.t + tortion * (-0.5 + Math.random()),
            },
            children: [],
          };
          addLeaves(leaf, [newLeaf]);
          toAdd.add(newLeaf);
        }
      }
      leaves.delete(leaf);
    }
    for (const leaf of toAdd) {
      leaves.add(leaf);
    }

    requestAnimationFrame(animate);
  };
  animate();
}
