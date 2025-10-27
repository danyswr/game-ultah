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
  private walkingTween?: Phaser.Tweens.Tween;
  private lastDirection: string = 'down';
  private collisionGroup?: Phaser.Physics.Arcade.StaticGroup;
  private bgMusic?: Phaser.Sound.BaseSound;
  private npc?: Phaser.GameObjects.Sprite;
  private interactionKey?: Phaser.Input.Keyboard.Key;
  private interactionPrompt?: Phaser.GameObjects.Text;
  private isNearNPC: boolean = false;

  constructor() {
    super({ key: 'RPGScene' });
  }

  preload() {
    this.load.image('rpg-map', '/assets/rpg-map.png');
    this.load.image('character', '/assets/character2.png');
    this.load.image('npc', '/assets/character1.png');
    this.load.audio('rpg-music', '/sounds/background.mp3');
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
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      playerBody.setCollideWorldBounds(true);
      playerBody.setSize(this.player.width * 0.6, this.player.height * 0.4);
      playerBody.setOffset(this.player.width * 0.2, this.player.height * 0.5);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    this.createCollisionZones(map.displayWidth, map.displayHeight);
    this.createNPC(width, height);

    this.interactionKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.interactionPrompt = this.add.text(0, 0, 'Tekan E untuk berbicara', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.interactionPrompt.setOrigin(0.5);
    this.interactionPrompt.setVisible(false);
    this.interactionPrompt.setDepth(100);
    this.interactionPrompt.setScrollFactor(0);

    this.bgMusic = this.sound.add('rpg-music', { volume: 0.3, loop: true });
    this.bgMusic.play();

    console.log('RPG Scene created. Controls: WASD or Arrow Keys, E to interact');
  }

  private createNPC(width: number, height: number) {
    this.npc = this.add.sprite(width / 2 + 100, height / 2 - 50, 'npc');
    this.npc.setScale(0.25);
    this.npc.setDepth(9);
    
    this.physics.add.existing(this.npc, true);
    
    this.tweens.add({
      targets: this.npc,
      y: this.npc.y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createCollisionZones(mapWidth: number, mapHeight: number) {
    this.collisionGroup = this.physics.add.staticGroup();

    const tileSize = 50;
    const zones: Array<{x: number, y: number, width: number, height: number}> = [
      { x: 0, y: 0, width: mapWidth * 0.15, height: mapHeight },
      { x: 0, y: 0, width: mapWidth, height: mapHeight * 0.15 },
      { x: mapWidth * 0.85, y: 0, width: mapWidth * 0.15, height: mapHeight },
      { x: 0, y: mapHeight * 0.85, width: mapWidth, height: mapHeight * 0.15 },
      
      { x: mapWidth * 0.25, y: mapHeight * 0.15, width: mapWidth * 0.15, height: mapHeight * 0.25 },
      { x: mapWidth * 0.6, y: mapHeight * 0.15, width: mapWidth * 0.25, height: mapHeight * 0.2 },
      { x: mapWidth * 0.25, y: mapHeight * 0.65, width: mapWidth * 0.15, height: mapHeight * 0.2 },
      { x: mapWidth * 0.6, y: mapHeight * 0.6, width: mapWidth * 0.25, height: mapHeight * 0.25 },
      
      { x: mapWidth * 0.4, y: mapHeight * 0.3, width: mapWidth * 0.15, height: mapHeight * 0.4 },
    ];

    zones.forEach(zone => {
      const rect = this.add.rectangle(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.width,
        zone.height,
        0x000000,
        0
      );
      this.physics.add.existing(rect, true);
      this.collisionGroup?.add(rect);
    });

    if (this.player && this.collisionGroup) {
      this.physics.add.collider(this.player, this.collisionGroup);
    }
  }

  update() {
    if (!this.player || !this.player.body) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let moving = false;
    let newDirection = this.lastDirection;

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      body.setVelocityX(-this.playerSpeed);
      moving = true;
      newDirection = 'left';
      this.player.setFlipX(true);
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      body.setVelocityX(this.playerSpeed);
      moving = true;
      newDirection = 'right';
      this.player.setFlipX(false);
    }

    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      body.setVelocityY(-this.playerSpeed);
      moving = true;
      newDirection = 'up';
    } else if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      body.setVelocityY(this.playerSpeed);
      moving = true;
      newDirection = 'down';
    }

    if (moving && body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(this.playerSpeed);
    }

    this.lastDirection = newDirection;

    if (moving) {
      if (!this.walkingTween || !this.walkingTween.isPlaying()) {
        this.walkingTween = this.tweens.add({
          targets: this.player,
          scaleY: 0.32,
          duration: 150,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      if (this.walkingTween) {
        this.walkingTween.stop();
        this.player.setScale(0.3);
      }
    }

    if (this.npc && this.player) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.npc.x,
        this.npc.y
      );

      if (distance < 100) {
        this.isNearNPC = true;
        if (this.interactionPrompt) {
          const screenWidth = this.cameras.main.width;
          const screenHeight = this.cameras.main.height;
          this.interactionPrompt.setPosition(screenWidth / 2, screenHeight - 60);
          this.interactionPrompt.setVisible(true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.interactionKey!)) {
          this.scene.pause();
          this.scene.launch('DialogScene', { 
            message: 'Halo! Selamat ulang tahun yang ke-21, Kayla! Semoga semua impianmu tercapai dan hari-harimu selalu penuh kebahagiaan! 🎉',
            scene: this
          });
        }
      } else {
        this.isNearNPC = false;
        if (this.interactionPrompt) {
          this.interactionPrompt.setVisible(false);
        }
      }
    }
  }
}
