/*
    @@TODO 
    1. 플레이어가 맵 밖으로 나갈 시 모든블럭들 해당 방향의 반대방향으로 이동 [해결]
    1.1. 단 블럭이 이동할때도 충돌이 발생한다면 원위치 [해결]
    1.2. 맵 밖 이탈 금지 - 플레이어 [해결]
    2. 플레이어의 방향으로 CTRL클릭시 방향에 있는 블럭 하나만 없애기[해결]
    3. 플레이어의 방향으로 ALT클릭시 방향에 블럭하나 설치 [해결]
    3.1 블럭설치시 scroll value에 맞춰서 align하기 (블럭이 이동할때 25단위로 맞추면 삐뚤어짐)
    4. 블럭단위 -> 청크단위로 변환하기 
    5. 플레이어주변 블럭 안개설정하기 
    6. 와드 시스템 도입 -> 와드 주변 9칸만 밝히기-> 도로만

    6. 몬스터 추가
    7. 인벤토리 추가 
    8. HUD 추가 
    9. 블럭에 클릭횟수를 추가하여 한번에 안부서지게 하기
*/

// 현재 플레이어가 가리키는 인덱스 
let current_index = 0 // Grass ~ Emerald

const inventory_ul = document.querySelector(".inventory ul")
const hud_div = document.querySelector(".hud")

const canvas = document.querySelector('canvas')

const ctx = canvas.getContext('2d')
//25 * 20 => 500

canvas.width = 500
canvas.height = 500

const canvas_position = {
    x: canvas.getBoundingClientRect().x,
    y: canvas.getBoundingClientRect().y
}

const PLAYER_COLOR = 'salmon'

const MAP_WIDTH = 600
const MAP_HEIGHT = 600

const BLOCK_SIZE = 25

const LEFT = 1
const RIGHT = 2
const UP = 3
const DOWN = 4

const AIR = 0x0000 
const Grass = 0x0001
const Stone = 0x0002
const Cobble = 0x0003
const Dirt = 0x0004 
const Emerald = 0x0005
const Bedrock = 0x0006

const BLOCK_COLOR = {
    0 : '#EEE',
    1 : '#3a5a40', 
    2 : '#888C8D',
    3 : '#bfc0c0',
    4 : '#9c6644', 
    5 : '#7bf1a8', 
    6 : '#2C3333'
}

const block_position_value = {
    x: 0, 
    y: 0
}

class Actor{
    constructor(x_pos, y_pos, w, h, cl, hp){
        this.position = {
            x: x_pos, 
            y: y_pos 
        }
        this.velocity = {
            x: 0, 
            y: 0
        }
        this.width = w 
        this.height = h
        this.color = cl 
        this.direction = UP
        this.max_hp = hp
        this.current_hp = hp
    }

    set_direction(dir){
        this.direction = dir
    }

    draw(){
        ctx.fillStyle = this.color
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
    }
    
    update(){

    }

    /*
        BLOCK과의 충돌 - 공기와는 X 
        actor 기준 16칸만 listing 하고 싶은데 
    */ 
    is_block_collision(){
        for(let block of blocks){
            if(this.position.x + this.velocity.x < block.position.x + block.width
                && this.position.x + this.width + this.velocity.x > block.position.x
                && this.position.y + this.height + this.velocity.y > block.position.y
                && this.position.y + this.velocity.y < block.position.y + block.height){
                    return true
            }
        }
        return false
    }
    /*
        블럭의 이동발생 가능성 velocity값을 두어서 미리 충돌 확인
    */
    is_block_velocity_collision(){
        for(let block of blocks){
            if(this.position.x + this.velocity.x < block.position.x + block.velocity.x + block.width
                && this.position.x + this.width + this.velocity.x  > block.position.x + block.velocity.x
                && this.position.y + this.height + this.velocity.y > block.position.y + block.velocity.y
                && this.position.y + this.velocity.y < block.position.y + block.height + block.velocity.y){
                    return true
            }
        }
        return false 
    }

}

class Player extends Actor{
    constructor(x_pos, y_pos, w, h, hp){
        super(x_pos, y_pos, w, h, 'salmon', hp)
        this.scroll_value = {
            x: 0,
            y: 0
        }
        this.point = {
            x: 0, 
            y: 0
        }

        this.inventory = [
            {
                'code' : Stone,
                'num' : 3
            },
            {
                'code' : Cobble,
                'num' : 5
            },
            {
                'code' : Grass, 
                'num' : 12
            },
            {
                'code' : Dirt,
                'num' : 3
            },
            {  
                'code' : Emerald, 
                'num' : 0
            }
        ]
    }
    update(){
        this.move()
        this.draw()
    }

    // 헬스바 업데이트 
    update_healthbar(){
        this.current_hp = 3
        hud_div.innerHTML = "" 
        let count = 0;
        for(let i=0;i<this.max_hp;i++){
            let div = document.createElement("div")
            if(count < this.current_hp){
                div.classList.add("heart")
                count+=1
            }else{
                div.classList.add("heart")
                div.classList.add("blank")
            }
            
            hud_div.appendChild(div)
        }

    }

    // 인벤토리 업데이트
    update_inventory(){
        inventory_ul.innerHTML = ""
        for(let i=0;i<5;i++){
            let li = document.createElement("li")
            li.classList.add("item__box")
            let div = document.createElement("div")
            div.classList.add("block")
            let span = document.createElement("span")

            const item = this.inventory[i]
            let code = item['code']
            let num = item['num']


            // 블럭 클래스 설정
            if(code == Stone){
                div.classList.add("stone")
                // 선택한 인벤토리 확대
                //li.classList.toggle('active')
            }else if(code == Cobble){
                div.classList.add("cobble")
            }else if(code == Grass){
                div.classList.add("grass")
            }else if(code == Dirt){
                div.classList.add("dirt")
            }else if(code == Emerald){
                div.classList.add('emerald')
            }

            if(code == current_index){
                li.classList.add('active')
            }else{
                li.classList.remove('active')
            }
            // 수량 입력
            span.innerText = num.toString()

            li.appendChild(div)
            li.appendChild(span)
    
            inventory_ul.appendChild(li)
        }
    }
    
    /*
        direciton에 따라 생성되는 점 
    */
    set_view_point(){
        // (2x + w) / 2, y
        if(this.direction == UP){
            this.point.x = parseInt((2*this.position.x + this.width) / 2)
            this.point.y = this.position.y - 25 //5는 보정값 
        }
        // (2x + w) / 2, y + h
        else if(this.direction == DOWN){
            this.point.x = parseInt((2*this.position.x + this.width) / 2)
            this.point.y = this.position.y + this.height + 25 //5는 보정값 
        }
        // x, (2y + h)/2
        else if(this.direction == LEFT){
            this.point.y = parseInt((2*this.position.y + this.height) / 2)
            this.point.x = this.position.x - 25 //5는 보정값 
        }
        // x+w, (2y+h)/2
        else if(this.direction == RIGHT){
            this.point.y = parseInt((2*this.position.y + this.height) / 2)
            this.point.x = this.position.x + this.width + 25 //5는 보정값 
        }
    }

    // shoot bullet
    shoot(){
        let bullet = new Bullet(this.point.x, this.point.y, this.direction)
        bullets.push(bullet)
    }

    // 블럭 삭제시 해당 코드 확인 후 인벤토리 업데이트
    // bedrock은 삭제 금지 
    remove_block(){
        blocks.some(block => {
            if((this.point.x >= block.position.x && this.point.x <= block.position.x + block.width)
                && (this.point.y >= block.position.y && this.point.y <= block.position.y + block.height)){
                    if(block.code == Bedrock){
                        return
                    }
                    // 인벤토리 설정
                    this.inventory.some(item => {
                        if(item['code'] == block.code){
                            item['num'] += 1
                        }
                    })
                    this.update_inventory()
                    
                    let index = blocks.indexOf(block)
                    blocks.splice(index, 1)
                    return true
                }
        })
    }

    // 키보드 키를 눌러서 지목형식
    // current_index에 맞춰서 진행
    install_block(){
        // 예외 범위 
        if(current_index < 1 || current_index > 6) return 
        let item = this.inventory.find(e => {
            if(e['code'] == current_index) return true
        })
        // 개수 부족
        if(item['num'] <= 0) return 

        let result = blocks.some(block => {
            if((this.point.x >= block.position.x && this.point.x <= block.position.x + block.width)
                && (this.point.y >= block.position.y && this.point.y <= block.position.y + block.height)){
                    return true
                }
        })
        // scroll_value가 아니라 블럭이 얼마만큼 이동했는지에 대한 값이 필요
        if(!result){
            let block_x = parseInt(this.point.x / 25) * 25 + block_position_value.x % 25
            let block_y = parseInt(this.point.y / 25) * 25 + block_position_value.y % 25
            console.log(block_x, block_y, block_position_value)
            let block = new Block(block_x, block_y, item['code'])
            blocks.push(block)
            item['num'] -= 1
            this.update_inventory()
        }
    }

    move(){
        if(keys.up.pressed && this.position.y > 0 + 100){
            this.velocity.y = -2
            this.velocity.x = 0
        }else if(keys.right.pressed && this.position.x + this.width < canvas.width - 100){
            this.velocity.x = 2
            this.velocity.y = 0
        }else if(keys.left.pressed && this.position.x  > 0 + 100){
            this.velocity.x = -2
            this.velocity.y = 0
        }else if(keys.down.pressed && this.position.y + this.height < canvas.height - 100){
            this.velocity.x = 0
            this.velocity.y = 2
        }else{
            this.velocity.x = 0 
            this.velocity.y = 0
            /*
                블럭이 이동하기전에 플레이어와의 충돌이 있을지 확인
                각 각의 블럭에 velocity를 두어서 확인 완료
                
                늘어난 공간만큼만 블록의 velocity값 설정 그 이상은 이동 X 
            */
            if(keys.right.pressed){
                if(this.scroll_value.x >= (MAP_WIDTH - canvas.width + 25)){
                    this.velocity.x = 2 
                    this.velocity.y = 0
                }else{
                    blocks.forEach(block => {
                        block.velocity.x = -2
                    })
                    this.scroll_value.x += 2
                    block_position_value.x -= 2
                }
            // 맵은 오른쪽과 아래쪽만 넓어지기 때문에 right and down만 신경 나머지는 0 
            }else if(keys.left.pressed){
                if(this.scroll_value.x <= 0){
                    this.velocity.x = -2 
                    this.velocity.y = 0
                }else{
                    blocks.forEach(block => {
                        block.velocity.x = 2
                    })
                    this.scroll_value.x -= 2
                    block_position_value.x += 2
                }
            }else if(keys.up.pressed){
                if(this.scroll_value.y <= 0){
                    this.velocity.x = 0 
                    this.velocity.y = -2
                }else{
                    blocks.forEach(block => {
                        block.velocity.y = 2
                    })
                    this.scroll_value.y -= 2
                    block_position_value.y += 2
                }
            }else if(keys.down.pressed){
                if(this.scroll_value.y >= (MAP_HEIGHT - canvas.height + 25)){
                    this.velocity.x = 0 
                    this.velocity.y = 2
                }else{
                    blocks.forEach(block => {
                        block.velocity.y = -2
                    })
                    this.scroll_value.y += 2
                    // 블럭이 지금까지 얼마만큼 이동했는지 확인
                    block_position_value.y -= 2
                }
            }
        }
        // 플레이어가 바라보는 방향 변경
        if(keys.right.pressed){
            this.set_direction(RIGHT)
        }else if(keys.left.pressed){
            this.set_direction(LEFT)
        }else if(keys.up.pressed){
            this.set_direction(UP)
        }else if(keys.down.pressed){
            this.set_direction(DOWN)
        }
        // direction에 따라 플레이어에 따라오는 점 생성 
        this.set_view_point()
        
        // 만약 블럭의 velocity값을 더했을 때 충돌이 발생ㅑ할것 같다면!
        if(this.is_block_velocity_collision()){
            blocks.forEach(block => {
                block.velocity.x = 0
                block.velocity.y = 0
            })
        }else{
            // 충돌이 발생하지 않을것 같다면 진행
            blocks.forEach(block => {
                block.position.x += block.velocity.x 
                block.position.y += block.velocity.y

                block.velocity.x = 0 
                block.velocity.y = 0
            })
        }
        

        if(this.is_block_collision()){
            return 
        }
        // MAP WIDTH 와 HEIGHT안에서만 움직임 적용 
        if((this.position.x + this.velocity.x >= 0 && this.position.x + this.width + this.velocity.x + this.scroll_value.x <= MAP_WIDTH)
            && (this.position.y + this.velocity.y >= 0 && this.position.y + this.height + this.velocity.y + this.scroll_value.y <= MAP_HEIGHT)){
                this.position.y += this.velocity.y
                this.position.x += this.velocity.x  
            }
        
    }
}

class Monster extends Actor{

}

class Npc extends Actor{

}

class Bullet{
    constructor(x_pos, y_pos, d){
        this.position = {
            x: x_pos,
            y: y_pos
        }
        this.velocity = {
            x: 0,
            y: 0
        }
        this.width = 5
        this.height = 5
        this.color = "black"
        this.damage = 1
        this.direction = d
    }

    move(){
        if(this.direction == UP){
            this.velocity.x = 0 
            this.velocity.y = -10
        }else if(this.direction == RIGHT){
            this.velocity.x = 10
            this.velocity.y = 0
        }else if(this.direction == LEFT){
            this.velocity.x = -10
            this.velocity.y = 0 
        }else if(this.direction == DOWN){
            this.velocity.x = 0 
            this.velocity.y = 10

        }

        this.position.x += this.velocity.x 
        this.position.y += this.velocity.y
    }

    draw(){
        ctx.fillStyle = this.color
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    update(){
        this.move()
        this.draw()
    }
}

class Block{
    constructor(x_pos, y_pos, t){
        this.position = {
            x: x_pos, 
            y: y_pos 
        }
        this.velocity = {
            x: 0, 
            y: 0
        }
        this.width = BLOCK_SIZE
        this.height = BLOCK_SIZE
        this.code = t
        this.color = BLOCK_COLOR[this.code]
    }

    draw(){
        ctx.fillStyle = this.color
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    update(){
        this.draw()
    }
    
}

/*
    이런식? 
*/
let map_config = [
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 0, 0, 2, 2, 2, 2, 1, 1, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 0, 0, 2, 2, 2, 3, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 3, 2, 3, 2, 2, 2, 2, 6,
    6, 0, 0, 0, 0, 0, 0, 2, 3, 2, 2, 2, 0, 0, 2, 2, 2, 2, 4, 4, 4, 2, 2, 2, 6,
    6, 0, 0, 2, 2, 0, 0, 2, 2, 3, 2, 2, 0, 0, 2, 2, 2, 3, 3, 2, 2, 2, 3, 2, 6,
    6, 0, 0, 2, 2, 0, 0, 2, 2, 3, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 0, 0, 2, 3, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 6,
    6, 0, 0, 2, 2, 3, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 0, 0, 2, 2, 2, 2, 2, 3, 3, 3, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 0, 0, 2, 2, 3, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 6,
    6, 0, 0, 2, 3, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 6,
    6, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6,
    6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6,
    6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 2, 2, 2, 3, 3, 2, 4, 4, 2, 2, 2, 0, 0, 2, 3, 3, 2, 5, 2, 2, 2, 3, 2, 6,
    6, 2, 2, 2, 2, 2, 2, 5, 4, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 2, 2, 3, 3, 2, 3, 3, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 6,
    6, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6,
    6, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
]

/*
    map_config를 읽으면서 생성한 블럭집합
*/
const blocks = [

]

const bullets = [

]

//300, 500 맵(canvas) 밖에 플레이어가 존재할 시 그에 맞춰서 맵 이동? 
const player = new Player(350, 350, 20, 20, 5)

const keys = {
    right:{
        pressed: false 
    },
    left:{
        pressed: false
    },
    up:{
        pressed: false
    },
    down:{
        pressed: false
    }
}

// 좌표에 맞게 블록을 청크에 삽입
function init_map(){
    let row = 0 
    let col = 0
    for(let code of map_config){
        let tmp_row = row*25 
        let tmp_col = col*25
        row+=1
        if(row >= 25){
            row=0 
            col+=1
        }
        // Air block is exclude in blocks 
        if(code == 0){
            continue
        }
        let block = new Block(tmp_row, tmp_col, code)

        blocks.push(block)
    }
}


function animate(){
    requestAnimationFrame(animate)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    blocks.forEach( (block) => {
        block.update()
    })
    bullets.forEach( bullet => {
        bullet.update()
    })
    player.update()
}

function init(){
    init_map()
    player.update_inventory() 
    player.update_healthbar()
    animate() 
}

init()


addEventListener('keydown', ({keyCode}) => {
    switch(keyCode){   
        // UP 
        case 38:
            keys.up.pressed = true
            break 
        // LEFT
        case 37:
            keys.left.pressed = true
            break
        // RIGHT 
        case 39:
            keys.right.pressed = true
            break
        // DOWN
        case 40:
            keys.down.pressed = true
            break 
    }
})

addEventListener('keyup', ({keyCode}) => {
    switch(keyCode){
        case 49: 
            current_index = Stone
            player.update_inventory()
            break 

        case 50:
            current_index = Cobble
            player.update_inventory()
            break 

        case 51:
            current_index = Grass
            player.update_inventory()
            break

        case 52:
            current_index = Dirt
            player.update_inventory()
            break

        case 53:
            current_index = Emerald
            player.update_inventory()
            break

        // bullet 
        case 65:
            player.shoot()
            break 
        // X
        case 88:
            player.install_block()
            break
        //CTRL
        case 17:
            player.remove_block()
            break
        // UP 
        case 38:
            keys.up.pressed = false
            break 
        // LEFT
        case 37:
            keys.left.pressed = false
            break
        // RIGHT 
        case 39:
            keys.right.pressed = false
            break
        // DOWN
        case 40:
            keys.down.pressed = false
            break 
    }
})
