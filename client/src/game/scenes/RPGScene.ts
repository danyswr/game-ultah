import Phaser from 'phaser';

export default class RPGScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Sprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private playerSpeed: number = 160;

  constructor() {
    super({ key: 'RPGScene' });
  }

  preload() {
    this.load.image('rpg-map', '/assets/rpg-map.png');
    this.load.image('character', '/assets/character2.png');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const map = this.add.image(0, 0, 'rpg-map');
    map.setOrigin(0, 0);
    
    const scaleX = width / map.width;
    const scaleY = height / map.height;
    const scale = Math.max(scaleX, scaleY);
    map.setScale(scale);

    this.player = this.add.sprite(width / 2, height / 2, 'character');
    this.player.setScale(0.3);
    this.player.setDepth(10);

    this.cursors = this.input.keyboard?.createCursorKeys();
    
    if (this.input.keyboard) {
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    const instructions = this.add.text(20, 20, 'Gunakan WASD atau Arrow Keys untuk bergerak', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: '#000000',
      padding: { x: 15, y: 10 }
    });
    instructions.setDepth(100);
    instructions.setScrollFactor(0);

    this.cameras.main.setBounds(0, 0, map.displayWidth, map.displayHeight);
    this.physics.world.setBounds(0, 0, map.displayWidth, map.displayHeight);

    if (this.player) {
      this.physics.add.existing(this.player);
      (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    console.log('RPG Scene created. Controls: WASD or Arrow Keys');
  }

  update() {
    if (!this.player || !this.player.body) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let moving = false;

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      body.setVelocityX(-this.playerSpeed);
      moving = true;
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      body.setVelocityX(this.playerSpeed);
      moving = true;
    }

    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      body.setVelocityY(-this.playerSpeed);
      moving = true;
    } else if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      body.setVelocityY(this.playerSpeed);
      moving = true;
    }

    if (moving && body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(this.playerSpeed);
    }
  }
}
