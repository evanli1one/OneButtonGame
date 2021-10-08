title = "Warpshot";

description = `
Click and hold to aim and shoot
`;

characters = [
];

const G = {
    WIDTH: 400,
    HEIGHT: 400,
    WARPEDGE: 2
};

options = {
    viewSize: {x: G.WIDTH, y: G.HEIGHT},
    theme: "shapeDark",
    isReplayEnabled: true,
    isPlayingBgm: true,
    seed: 3,
    isDrawingScoreFront: true
};

/**
* @typedef { object } Player
* @property { Vector } pos
* @property { Vector } boostVec
* @property { Vector } currVelocity
* @property { Number } currBoost
* @property { Boolean } isBoost
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

let enemySize = 40;
let enemySpeedIncrease = 0.1;
let enemySplitNum = 2;
let enemySpeed = 1;
let enemyStartNum = 10;

let bulletSpeed = 0.08;
let bulletSize = 5;
let minAimLength = 50;

let minMoveLength = 0.01;
let moveSpeed = 0.002;
let aimSpeed = 0.002;

let boostDuration = 180;
let boostDecay = 0.9;
let boostSpeed = 15;

let aimPoint;
let aimVector;
let isAiming;
let chargingShot = false;


function update() {

    if (!ticks) {
        Start();
    }

    ShootInput();

    RenderAimLine();
    
    RenderInteractions();

    if(player.currBoost > 0)
    {
        player.boostVec = vec(player.boostVec.x * boostDecay,
            player.boostVec.y * boostDecay);
        player.currBoost--;
    }
    else
    {
        player.isBoost = false;
    }
}

function Start()
{
    player = {
        pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
        boostVec: vec(0, 0),
        currVelocity: vec(0, 0),
        currBoost: 0,
        isBoost: false
    };

    aimLine = {
        pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
    };

    isAiming = false;

    times(enemyStartNum, () => {
        RandSpawnEnemy(enemySpeed);
    })
}

function RenderPlayer()
{
    let currInput = vec(input.pos.x, input.pos.y);
    let inputVector = vec(currInput.x - player.pos.x,
         currInput.y - player.pos.y);
    let inputLength = inputVector.length * 0.8;
    let inputDirection = inputVector.normalize();
         
    if(inputLength > minMoveLength)
    {
        let previousVelocity;
        let moveVector;

        if(isAiming)
        {
            moveVector = vec(inputDirection.x * inputLength * aimSpeed,
                inputDirection.y * inputLength * aimSpeed);
            previousVelocity = vec(player.currVelocity.x * 0.98, 
                player.currVelocity.y * 0.98);
        }
        else
        {
            moveVector = vec(inputDirection.x * inputLength * moveSpeed,
                inputDirection.y * inputLength * moveSpeed);

            previousVelocity = player.currVelocity;
        }

        player.pos.add(moveVector.add(previousVelocity));

        player.currVelocity = moveVector;
    }

    if(player.isBoost)
    {
        let finalBoostVec = vec(player.boostVec.x * boostSpeed,
            player.boostVec.y * boostSpeed);
        player.pos.add(finalBoostVec);
    }

    player.pos.wrap(0, G.WIDTH, 0, G.HEIGHT);

    color("cyan");
    box(player.pos, 12);
    let particleAngle = atan2(player.currVelocity.y, player.currVelocity.x) + PI;
    particle(player.pos.x, player.pos.y, 1, 2, particleAngle, PI/4);
}

function RenderAimLine()
{
    if(isAiming)
    {
        aimVector = vec(aimPoint.x - player.pos.x, aimPoint.y - player.pos.y);

        player.boostVec = aimVector;

        if(aimVector.length > minAimLength)
        {
            if(chargingShot)
            {
                play("laser");
                chargingShot = false;
            }
            
            color("green");
        }
        else
        {
            chargingShot = true;
            color("blue");
        }

        line(aimPoint.x, aimPoint.y, player.pos.x, player.pos.y);
    }
}

function RenderBullets()
{
    bulletList.forEach(bullet => {
        bullet.pos.add(bullet.velocity);

        bullet.pos.wrap(-bulletSize, G.WIDTH + bulletSize, 
            -bulletSize, G.HEIGHT + bulletSize)

        color("yellow");
        box(bullet.pos, 8)
        let particleAngle = atan2(bullet.velocity.y, bullet.velocity.x) + PI;
        particle(bullet.pos.x, bullet.pos.y, 1, 2, particleAngle, PI/4);
    })
}

function RenderInteractions()
{
    RenderPlayer();
    
    RenderBullets();

    remove(enemyList, enemy => {
        enemy.pos.add(enemy.velocity);
        enemy.pos.wrap(-G.WARPEDGE * enemySize, G.WIDTH + G.WARPEDGE * enemySize, 
            -G.WARPEDGE  * enemySize, G.HEIGHT + G.WARPEDGE * enemySize)

        color("light_red");
        let playerHit = box(enemy.pos, enemySize)
            .isColliding.rect.cyan;

        if (playerHit)
        {
            GameOver();
        }
        
        const enemyHit = box(enemy.pos, enemySize)
            .isColliding.rect.yellow;

        if(enemyHit)
        {
            play("coin");
            addScore(1);

            color("red");
            particle(enemy.pos.x, enemy.pos.y, 100, 4, 0, 2 * PI);
            
            RandSpawnEnemy(enemy.speed + enemySpeedIncrease)
        }

        return enemyHit;
    });

    remove(bulletList, bullet => {
        color("yellow");

        const bulletHitEnemy = box(bullet.pos, bulletSize)
            .isColliding.rect.light_red;

        const bulletHitPlayer = box(bullet.pos, bulletSize)
            .isColliding.rect.cyan;

        if(bulletHitPlayer)
        {
            GameOver();
        }

        return bulletHitEnemy;
    })
    
}

function ShootInput()
{
    if(input.isJustPressed)
    {
        play("powerUp");
        isAiming = true;
        aimPoint = vec(player.pos.x, player.pos.y);

        player.isBoost = false;
        player.currBoost = 0;
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
        play("explosion");
        player.isBoost = true;
        player.currBoost = boostDuration;

        let aimLineLength = aimVector.length;
        let direction = aimVector.normalize();
        bulletList.push({
            pos: vec(aimPoint.x, aimPoint.y),
            direction: direction,
            aimLineLength: aimLineLength,
            velocity: vec(direction.x * bulletSpeed * aimLineLength,
                direction.y * bulletSpeed * aimLineLength),
            speed: bulletSpeed
        })
    }
    else
    {
        play("select");
    }
}

function SpawnEnemy(spawnPos, speed)
{
    let direction = vec(rnds(-1, 1), rnds(-1, 1)).normalize();
    enemyList.push({
        pos: spawnPos,
        direction: direction,
        velocity: vec(direction.x * speed, direction.y * speed),
        speed: speed
    })
}

function RandSpawnEnemy(speed)
{
    let newSpawn = vec(-G.WARPEDGE * enemySize, rnd(0, G.HEIGHT))
    let direction = vec(rnds(-1, 1), rnds(-1, 1)).normalize();
    enemyList.push({
        pos: newSpawn,
        direction: direction,
        velocity: vec(direction.x * speed, direction.y * speed),
        speed: speed
    })
}

function GameOver() {
    play("lucky");

    remove(enemyList, () => {
        return true;
    })

    remove(bulletList, () => {
        return true;
    })

    end();
}