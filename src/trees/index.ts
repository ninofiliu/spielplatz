type Vec2 = [number, number];

type Tree = {
  pos: Vec2;
  vel: Vec2;
  weight: number;
  children: Tree[];
};

const dfs = (tree: Tree, cb: (walked: Tree) => void) => {
  cb(tree);
  for (const child of tree.children) {
    dfs(child, cb);
  }
};

const tree: Tree = {
  pos: [0, 0],
  vel: [0, 0],
  weight: 1,
  children: [
    {
      pos: [1, 0],
      vel: [-1, 0],
      weight: 1,
      children: [],
    },
    {
      pos: [2, 1],
      vel: [-1, 0],
      weight: 1,
      children: [
        {
          pos: [3, 0],
          vel: [-1, 0],
          weight: 1,
          children: [],
        },
      ],
    },
  ],
};

const dims: Vec2 = [window.innerWidth, window.innerHeight];
const canvas = document.createElement("canvas");
canvas.width = dims[0];
canvas.height = dims[1];
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.append(canvas);
const ctx = canvas.getContext("2d");

const canvasPos = (pos: Vec2) =>
  pos.map((w, i) => dims[i] * (0.5 + 0.1 * w)) as Vec2;

ctx.lineWidth = 1;
ctx.fillStyle = "black";
ctx.fillRect(0, 0, dims[0], dims[1]);
ctx.strokeStyle = "white";
dfs(tree, (walked) => {
  const from = canvasPos(walked.pos);
  for (const child of walked.children) {
    const to = canvasPos(child.pos);
    ctx.moveTo(...from);
    ctx.lineTo(...to);
    ctx.stroke();
    console.log(from, to);
  }
});
