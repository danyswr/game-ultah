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
    this.load.spritesheet('girl-side-walking', '/assets/girl-side-walking.png', {
      frameWidth: 256,
      frameHeight: 256
    });
    this.load.image('npc', '/assets/character1.png');
    this.load.audio('rpg-music', '/sounds/background.mp3');
    this.load.audio('collect', '/sounds/success.mp3');
    
    this.createParticleTexture();
    this.createHeartTextures();
  }

  private createParticleTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFB6C1, 1);
    graphics.fillCircle(2, 2, 2);
    graphics.generateTexture('particle', 4, 4);
    graphics.destroy();
  }

  private createHeartTextures() {
    const graphics = this.add.graphics();
    const frameCount = 8;
    
    for (let i = 0; i < frameCount; i++) {
      graphics.clear();
      
      const rotation = (i / frameCount) * Math.PI * 2;
      const scaleEffect = 1 + Math.sin(rotation) * 0.2;
      
      const points: number[] = [];
      const segments = 50;
      const centerX = 16;
      const centerY = 16;
      const size = 4 * scaleEffect;
      
      for (let j = 0; j <= segments; j++) {
        const t = (j / segments) * Math.PI * 2;
        
        const hx = size * 16 * Math.pow(Math.sin(t), 3);
        const hy = size * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 
                          2 * Math.cos(3 * t) - Math.cos(4 * t));
        
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const rotatedX = hx * cos - hy * sin;
        const rotatedY = hx * sin + hy * cos;
        
        points.push(centerX + rotatedX, centerY - rotatedY);
      }
      
      graphics.fillStyle(0xFF1493, 1);
      graphics.fillPoints(points, true);
      
      graphics.generateTexture(`heart-frame-${i}`, 32, 32);
    }
    
    graphics.destroy();
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const levelWidth = width * 3;
    const levelHeight = height;

    const map = this.add.image(0, 0, 'rpg-map');
    map.setOrigin(0, 0);
    map.setDisplaySize(levelWidth, levelHeight);

    const groundY = height * 0.7;

    this.player = this.add.sprite(200, groundY, 'girl-side-walking', 0);
    this.player.setScale(0.5);
    this.player.setDepth(10);
    
    if (!this.anims.exists('girl-walk-side')) {
      this.anims.create({
        key: 'girl-walk-side',
        frames: this.anims.generateFrameNumbers('girl-side-walking', { start: 0, end: 3 }),
        frameRate: 16,
        repeat: -1
      });
    }
    
    if (!this.anims.exists('girl-idle-side')) {
      this.anims.create({
        key: 'girl-idle-side',
        frames: [{ key: 'girl-side-walking', frame: 0 }],
        frameRate: 1
      });
    }
    
    if (!this.anims.exists('heart-spin')) {
      const frames = [];
      for (let i = 0; i < 8; i++) {
        frames.push({ key: `heart-frame-${i}`, frame: 0 });
      }
      this.anims.create({
        key: 'heart-spin',
        frames: frames,
        frameRate: 12,
        repeat: -1
      });
    }

    this.cursors = this.input.keyboard?.createCursorKeys();
    
    if (this.input.keyboard) {
      // Only A and D keys for left/right movement - NO vertical movement
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    const instructions = this.add.text(20, 20, 'Gunakan A/D atau ← → untuk bergerak kiri/kanan', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: '#000000',
      padding: { x: 15, y: 10 }
    });
    instructions.setDepth(100);
    instructions.setScrollFactor(0);

    this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);
    this.physics.world.setBounds(0, 0, levelWidth, levelHeight);

    if (this.player) {
      this.physics.add.existing(this.player);
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      playerBody.setCollideWorldBounds(true);
      playerBody.setSize(this.player.width * 0.3, this.player.height * 0.5);
      playerBody.setOffset(this.player.width * 0.35, this.player.height * 0.4);
      
      // Reduced zoom to show more of the character and prevent cutoff
      this.cameras.main.setZoom(1.2);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.05);
      
      this.playerTrail = this.add.particles(0, 0, 'particle', {
        follow: this.player,
        followOffset: { x: -20, y: this.player.height * 0.2 },
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

    this.createBirthdayTokens(levelWidth, groundY);
    this.createNPC(levelWidth, groundY);
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
    
    const controlsText = this.add.text(-160, 30, '⌨️ A/D atau ← →: Gerak | E: Bicara', {
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

  private createBirthdayTokens(levelWidth: number, groundY: number) {
    const tokenPositions = [
      { x: levelWidth * 0.3, y: groundY - 100 },
      { x: levelWidth * 0.5, y: groundY - 150 },
      { x: levelWidth * 0.75, y: groundY - 120 }
    ];
    
    tokenPositions.forEach((pos, index) => {
      const token = this.add.sprite(pos.x, pos.y, 'heart-frame-0');
      token.setScale(2.5);
      token.setDepth(8);
      
      token.play('heart-spin');
      
      this.physics.add.existing(token, true);
      
      this.tweens.add({
        targets: token,
        y: pos.y - 20,
        duration: 1000 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      const glow = this.add.circle(pos.x, pos.y, 40, 0xFF1744, 0.4);
      glow.setDepth(7);
      
      this.tweens.add({
        targets: glow,
        scale: 1.5,
        alpha: 0.1,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.tokens.push({ sprite: token, glow: glow, collected: false });
    });
  }

  private createNPC(levelWidth: number, groundY: number) {
    this.npc = this.add.sprite(levelWidth - 300, groundY, 'npc');
    this.npc.setScale(0.4);
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

  update() {
    if (!this.player || !this.player.body) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    // Lock vertical movement completely
    body.setVelocityY(0);

    let moving = false;
    let newDirection = this.lastDirection;

    // ONLY left/right movement - A/D and arrow keys, NO vertical movement
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      body.setVelocityX(-this.playerSpeed);
      moving = true;
      newDirection = 'left';
      this.player.setFlipX(true);
      console.log('Moving left');
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      body.setVelocityX(this.playerSpeed);
      moving = true;
      newDirection = 'right';
      this.player.setFlipX(false);
      console.log('Moving right');
    }
    // W/S and Up/Down arrows are completely ignored - no vertical movement allowed

    this.lastDirection = newDirection;

    if (moving) {
      if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== 'girl-walk-side') {
        this.player.play('girl-walk-side', true);
      }
    } else {
      if (this.player.anims.currentAnim?.key !== 'girl-idle-side') {
        this.player.play('girl-idle-side', true);
      }
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
    
    const collectEmitter = this.add.particles(tokenObj.sprite.x, tokenObj.sprite.y, 'heart-frame-0', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
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
