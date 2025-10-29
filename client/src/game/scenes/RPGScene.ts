import Phaser from 'phaser';

interface BirthdayToken {
  sprite: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Arc;
  collected: boolean;
}

export default class RPGScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Sprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private playerSpeed: number = 180;
  private walkingTween?: Phaser.Tweens.Tween;
  private lastDirection: string = 'down';
  private collisionGroup?: Phaser.Physics.Arcade.StaticGroup;
  private bgMusic?: Phaser.Sound.BaseSound;
  private npc?: Phaser.GameObjects.Sprite;
  private interactionKey?: Phaser.Input.Keyboard.Key;
  private interactionPrompt?: Phaser.GameObjects.Container;
  private isNearNPC: boolean = false;
  private tokens: BirthdayToken[] = [];
  private tokensCollected: number = 0;
  private totalTokens: number = 3;
  private hudContainer?: Phaser.GameObjects.Container;
  private tokenCountText?: Phaser.GameObjects.Text;
  private questText?: Phaser.GameObjects.Text;
  private playerTrail?: Phaser.GameObjects.Particles.ParticleEmitter;
  private vignette?: Phaser.GameObjects.Rectangle;
  private promptTweenPlaying: boolean = false;

  constructor() {
    super({ key: 'RPGScene' });
  }

  preload() {
    this.load.image('rpg-map', '/assets/forest-map.png');
    this.load.spritesheet('girl-walking', '/assets/girl-walking.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.image('npc', '/assets/character1.png');
    this.load.image('heart-sprite', '/assets/heart-sprite.png');
    this.load.audio('rpg-music', '/sounds/background.mp3');
    this.load.audio('collect', '/sounds/success.mp3');
    
    this.createParticleTexture();
  }

  private createParticleTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFB6C1, 1);
    graphics.fillCircle(2, 2, 2);
    graphics.generateTexture('particle', 4, 4);
    graphics.destroy();
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

    this.player = this.add.sprite(width / 2, height * 0.9, 'girl-walking', 0);
    this.player.setScale(0.4);
    this.player.setDepth(10);
    
    if (!this.anims.exists('girl-walk')) {
      this.anims.create({
        key: 'girl-walk',
        frames: this.anims.generateFrameNumbers('girl-walking', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: -1
      });
    }
    
    if (!this.anims.exists('girl-idle')) {
      this.anims.create({
        key: 'girl-idle',
        frames: [{ key: 'girl-walking', frame: 0 }],
        frameRate: 1
      });
    }

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
      
      this.cameras.main.setZoom(1.8);
      this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
      
      this.playerTrail = this.add.particles(0, 0, 'particle', {
        follow: this.player,
        followOffset: { x: 0, y: this.player.height * 0.15 },
        speed: { min: 10, max: 30 },
        scale: { start: 1.5, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 600,
        frequency: 30,
        blendMode: 'ADD',
        tint: [0xFFB6C1, 0xFF69B4, 0xFF1493]
      });
      this.playerTrail.setDepth(5);
    }

    this.createCollisionZones(map.displayWidth, map.displayHeight);
    this.createBirthdayTokens(map.displayWidth, map.displayHeight);
    this.createNPC(width, height);
    this.createVignette();
    this.createHUD();

    this.interactionKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    const promptBg = this.add.rectangle(0, 0, 200, 40, 0x000000, 0.8);
    promptBg.setStrokeStyle(2, 0xFF6B9D);
    
    const promptIcon = this.add.text(-80, 0, '💬', {
      fontSize: '20px'
    });
    promptIcon.setOrigin(0.5);
    
    const promptText = this.add.text(0, 0, 'Tekan E', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    promptText.setOrigin(0.5);
    
    this.interactionPrompt = this.add.container(0, 0, [promptBg, promptIcon, promptText]);
    this.interactionPrompt.setVisible(false);
    this.interactionPrompt.setDepth(100);
    this.interactionPrompt.setScrollFactor(0);

    this.bgMusic = this.sound.add('rpg-music', { volume: 0.3, loop: true });
    this.bgMusic.play();

    console.log('RPG Scene created. Controls: WASD or Arrow Keys, E to interact');
  }

  private createVignette() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.vignette = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.vignette.setScrollFactor(0);
    this.vignette.setDepth(1000);
    
    this.tweens.add({
      targets: this.vignette,
      alpha: 0.15,
      duration: 1000,
      ease: 'Sine.easeInOut'
    });
  }

  private createHUD() {
    const width = this.cameras.main.width;
    
    const hudBg = this.add.rectangle(0, 0, 350, 100, 0x000000, 0.7);
    hudBg.setStrokeStyle(3, 0xFF6B9D);
    
    this.questText = this.add.text(-160, -30, '💖 Quest: Kumpulkan 3 Hati', {
      fontSize: '16px',
      color: '#FF1744',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    
    this.tokenCountText = this.add.text(-160, 5, `💕 Hati: ${this.tokensCollected}/${this.totalTokens}`, {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    
    const controlsText = this.add.text(-160, 30, '⌨️ WASD/Arrow: Gerak | E: Bicara', {
      fontSize: '12px',
      color: '#AAAAAA',
      fontFamily: 'Arial'
    });
    
    this.hudContainer = this.add.container(width / 2, 70, [
      hudBg,
      this.questText,
      this.tokenCountText,
      controlsText
    ]);
    this.hudContainer.setScrollFactor(0);
    this.hudContainer.setDepth(999);
    this.hudContainer.setAlpha(0);
    
    this.tweens.add({
      targets: this.hudContainer,
      alpha: 1,
      y: 70,
      duration: 800,
      ease: 'Back.easeOut'
    });
  }

  private createBirthdayTokens(mapWidth: number, mapHeight: number) {
    const tokenPositions = [
      { x: mapWidth * 0.5, y: mapHeight * 0.7 },
      { x: mapWidth * 0.5, y: mapHeight * 0.5 },
      { x: mapWidth * 0.5, y: mapHeight * 0.3 }
    ];
    
    tokenPositions.forEach((pos, index) => {
      const token = this.add.sprite(pos.x, pos.y, 'heart-sprite');
      token.setScale(1.4);
      token.setDepth(8);
      
      this.physics.add.existing(token, true);
      
      this.tweens.add({
        targets: token,
        y: pos.y - 20,
        duration: 800 + index * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.tweens.add({
        targets: token,
        angle: 360,
        duration: 2500,
        repeat: -1,
        ease: 'Linear'
      });
      
      this.tweens.add({
        targets: token,
        scale: 1.5,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      const glow = this.add.circle(pos.x, pos.y, 30, 0xFF1744, 0.4);
      glow.setDepth(7);
      
      this.tweens.add({
        targets: glow,
        scale: 1.5,
        alpha: 0.1,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.tokens.push({ sprite: token, glow: glow, collected: false });
    });
  }

  private createNPC(width: number, height: number) {
    this.npc = this.add.sprite(width / 2, height * 0.1, 'npc');
    this.npc.setScale(0.3);
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

    const zones: Array<{x: number, y: number, width: number, height: number}> = [
      { x: 0, y: 0, width: mapWidth * 0.2, height: mapHeight },
      { x: mapWidth * 0.8, y: 0, width: mapWidth * 0.2, height: mapHeight },
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
      if (!this.player.anims.isPlaying) {
        this.player.play('girl-walk');
      }
    } else {
      this.player.play('girl-idle', true);
    }

    this.tokens.forEach((tokenObj, index) => {
      if (!tokenObj.collected && this.player) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          tokenObj.sprite.x,
          tokenObj.sprite.y
        );
        
        if (distance < 40) {
          this.collectToken(index);
        }
      }
    });

    if (this.npc && this.player) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.npc.x,
        this.npc.y
      );

      if (distance < 100) {
        this.isNearNPC = true;
        if (this.interactionPrompt && !this.interactionPrompt.visible) {
          const screenWidth = this.cameras.main.width;
          const screenHeight = this.cameras.main.height;
          this.interactionPrompt.setPosition(screenWidth / 2, screenHeight - 60);
          this.interactionPrompt.setVisible(true);
          this.promptTweenPlaying = false;
        }
        
        if (this.interactionPrompt && !this.promptTweenPlaying) {
          this.promptTweenPlaying = true;
          this.tweens.add({
            targets: this.interactionPrompt,
            scale: 1.05,
            duration: 300,
            yoyo: true,
            repeat: 0,
            onComplete: () => {
              this.promptTweenPlaying = false;
            }
          });
        }

        if (Phaser.Input.Keyboard.JustDown(this.interactionKey!)) {
          if (this.tokensCollected < this.totalTokens) {
            const message = `Hei! Kamu sudah menemukan ${this.tokensCollected}/${this.totalTokens} hati! Terus cari ya, aku tunggu kamu di sini! 💕`;
            
            this.scene.pause();
            this.scene.launch('DialogScene', { 
              message: message,
              scene: this
            });
          } else {
            this.cameras.main.fadeOut(800, 255, 228, 225);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.bgMusic?.stop();
              this.scene.start('HugScene');
            });
          }
        }
      } else {
        this.isNearNPC = false;
        if (this.interactionPrompt) {
          this.interactionPrompt.setVisible(false);
        }
      }
    }
  }

  private collectToken(index: number) {
    const tokenObj = this.tokens[index];
    
    if (tokenObj.collected) return;
    
    tokenObj.collected = true;
    this.tokensCollected++;
    
    this.sound.play('collect', { volume: 0.5 });
    
    const collectEmitter = this.add.particles(tokenObj.sprite.x, tokenObj.sprite.y, 'heart-sprite', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 10,
      frequency: -1
    });
    
    collectEmitter.setDepth(999);
    collectEmitter.explode(10);
    
    this.tweens.add({
      targets: tokenObj.sprite,
      scale: 2,
      alpha: 0,
      duration: 400,
      ease: 'Back.easeIn',
      onComplete: () => {
        tokenObj.sprite.destroy();
        tokenObj.glow.destroy();
        collectEmitter.destroy();
      }
    });
    
    if (this.tokenCountText) {
      this.tokenCountText.setText(`💕 Hati: ${this.tokensCollected}/${this.totalTokens}`);
      
      this.tweens.add({
        targets: this.tokenCountText,
        scale: 1.3,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut'
      });
    }
    
    if (this.tokensCollected === this.totalTokens && this.questText) {
      this.questText.setText('💝 Semua Hati Terkumpul! Temui Dia!');
      this.questText.setColor('#00FF00');
      
      this.tweens.add({
        targets: this.questText,
        scale: 1.2,
        duration: 300,
        yoyo: true,
        repeat: 2,
        ease: 'Back.easeOut'
      });
      
      this.cameras.main.flash(500, 255, 215, 0, false, (camera: any, progress: number) => {
        if (progress === 1) {
          console.log('All tokens collected!');
        }
      });
    }
  }
}
