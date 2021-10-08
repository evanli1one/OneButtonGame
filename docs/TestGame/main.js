title = "TestGame";

description = `
`;

characters = [
    `
    aaa
    aaa
    `
];

const G = {
    WIDTH: 200,
    HEIGHT: 200,
};

options = {
    viewSize: {x: G.WIDTH, y: G.HEIGHT},
    theme: "shapeDark"
};

/**
* @typedef { object } Player
* @property { Vector } pos
*/

/**
* @typedef { object } AimLine
* @property { Vector } pos
*/

/**
* @typedef { object } Bullet
* @property { Vector } pos
* @property { Vector } direction
* @property { Vector } velocity
* @property { Number } speed
* @property { Number } aimLineLength
*/

/**
* @typedef { object } Enemy
* @property { Vector } pos
* @property { Vector } direction
* @property { Vector } velocity
* @property { Number } speed
*/

/**
* @type  { Player }
*/
let player;

/**
* @type  { AimLine }
*/
let aimLine;

/**
* @type  { Bullet[] }
*/
let bulletList = [];

/**
* @type  { Enemy[] }
*/
let enemyList = [];

let enemySize = 100;
let enemySpeedIncrease = 1;
let enemySplitNum = 3;

let bulletSpeed = 0.1;
let minAimLength = 30;

let aimPoint;
let aimVector;
let isAiming;

function update() {
    if (!ticks) {
        Start();
    }

    RenderPlayer();

    ShootInput();

    RenderAimLine();
    
    RenderBulletEnemy();
}

function Start()
{
    player = {
        pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
    };

    aimLine = {
        pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
    };

    isAiming = false;

    let randSpawn = vec(rnd(0, G.WIDTH), rnd(0, G.HEIGHT));
    SpawnEnemy(randSpawn, 2);
}

function RenderPlayer()
{
    player.pos = vec(input.pos.x, input.pos.y);

    color("cyan");
    // box(player.pos, 10);
    char("a", player.pos);
    
}

function RenderAimLine()
{
    if(isAiming)
    {
        aimVector = vec(player.pos.x - aimPoint.x, player.pos.y - aimPoint.y);

        if(aimVector.length > minAimLength)
        {
            color("light_green")
        }
        else
        {
            color("light_blue")
        }

        line(aimPoint.x, aimPoint.y, player.pos.x, player.pos.y);
    }
}

function RenderBulletEnemy()
{
    bulletList.forEach(bullet => {
        bullet.pos.add(bullet.velocity);
        color("light_yellow");
        const bulletColliding = box(bullet.pos, 8)
            .isColliding.rect.red;

        
    });

    enemyList.forEach(enemy => {
        enemy.pos.add(enemy.velocity);
        enemy.pos.wrap(-enemySize, G.WIDTH + enemySize, 
            -enemySize, G.HEIGHT + enemySize)
        color("red");
        box(enemy.pos, enemySize);
    });

    remove(bulletList, bullet =>{
        return (!bullet.pos.isInRect(0, 0, G.WIDTH, G.HEIGHT));
    })
}

function ShootInput()
{
    if(input.isJustPressed)
    {
        isAiming = true;
        aimPoint = vec(input.pos.x, input.pos.y);
    }
    if(input.isJustReleased)
    {
        isAiming = false;
        Shoot();
    }
}

function Shoot()
{
    if(aimVector.length > minAimLength)
    {
        let aimLineLength = aimVector.length;
        let direction = aimVector.normalize();
        bulletList.push({
            pos: vec(player.pos.x, player.pos.y),
            direction: direction,
            aimLineLength: aimLineLength,
            velocity: vec(direction.x * bulletSpeed * aimLineLength,
                direction.y * bulletSpeed * aimLineLength),
            speed: bulletSpeed
        })
    }
}

function SplitEnemy(enemy)
{
    times(enemySplitNum, () => {
        SpawnEnemy(enemy.pos, enemy.speed + enemySpeedIncrease)
    })
}

function SpawnEnemy(spawnPos, enemySpeed)
{
    let direction = vec(rnd(-1, 1), rnd(-1, 1)).normalize();
    enemyList.push({
        pos: spawnPos,
        direction: direction,
        velocity: vec(direction.x * enemySpeed, direction.y * enemySpeed),
        speed: enemySpeed
    })
}