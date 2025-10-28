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
  private playerSpeed: number = 160;
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
  private totalTokens: number = 5;
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
    this.load.image('rpg-map', '/assets/rpg-map.png');
    this.load.image('character', '/assets/character2.png');
    this.load.image('npc', '/assets/character1.png');
    this.load.audio('rpg-music', '/sounds/background.mp3');
    this.load.audio('collect', '/sounds/success.mp3');
    
    this.createTokenTexture();
    this.createParticleTexture();
  }

  private createTokenTexture() {
    const graphics = this.add.graphics();
    
    graphics.fillStyle(0xFFD700, 1);
    graphics.fillCircle(16, 16, 14);
    
    graphics.fillStyle(0xFFA500, 1);
    graphics.fillCircle(16, 16, 10);
    
    graphics.fillStyle(0xFFD700, 1);
    graphics.fillCircle(16, 16, 6);
    
    graphics.generateTexture('birthday-token', 32, 32);
    graphics.destroy();
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
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      
      this.playerTrail = this.add.particles(0, 0, 'particle', {
        follow: this.player,
        followOffset: { x: 0, y: this.player.height * 0.15 },
        speed: 20,
        scale: { start: 1, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 400,
        frequency: 50,
        blendMode: 'ADD'
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
    
    this.questText = this.add.text(-160, -30, '🎂 Quest: Kumpulkan Token Ulang Tahun', {
      fontSize: '16px',
      color: '#FFD700',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    
    this.tokenCountText = this.add.text(-160, 5, `✨ Token: ${this.tokensCollected}/${this.totalTokens}`, {
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
      { x: mapWidth * 0.2, y: mapHeight * 0.3 },
      { x: mapWidth * 0.7, y: mapHeight * 0.25 },
      { x: mapWidth * 0.3, y: mapHeight * 0.7 },
      { x: mapWidth * 0.75, y: mapHeight * 0.65 },
      { x: mapWidth * 0.5, y: mapHeight * 0.85 }
    ];
    
    tokenPositions.forEach((pos, index) => {
      const token = this.add.sprite(pos.x, pos.y, 'birthday-token');
      token.setScale(1.2);
      token.setDepth(8);
      
      this.physics.add.existing(token, true);
      
      this.tweens.add({
        targets: token,
        y: pos.y - 15,
        duration: 1000 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.tweens.add({
        targets: token,
        angle: 360,
        duration: 3000,
        repeat: -1,
        ease: 'Linear'
      });
      
      const glow = this.add.circle(pos.x, pos.y, 25, 0xFFD700, 0.3);
      glow.setDepth(7);
      
      this.tweens.add({
        targets: glow,
        scale: 1.3,
        alpha: 0.1,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.tokens.push({ sprite: token, glow: glow, collected: false });
    });
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
          let message = '';
          
          if (this.tokensCollected < this.totalTokens) {
            message = `Halo! Kamu sudah mengumpulkan ${this.tokensCollected}/${this.totalTokens} token ulang tahun! Coba jelajahi map dan kumpulkan semuanya! ✨`;
          } else {
            message = 'Selamat! Kamu sudah mengumpulkan semua token ulang tahun! 🎉🎂\n\nSelamat ulang tahun yang ke-21, Kayla! Semoga semua impianmu tercapai dan hari-harimu selalu penuh kebahagiaan, cinta, dan kesuksesan! Terima kasih sudah bermain! 💖';
          }
          
          this.scene.pause();
          this.scene.launch('DialogScene', { 
            message: message,
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

  private collectToken(index: number) {
    const tokenObj = this.tokens[index];
    
    if (tokenObj.collected) return;
    
    tokenObj.collected = true;
    this.tokensCollected++;
    
    this.sound.play('collect', { volume: 0.5 });
    
    const collectEmitter = this.add.particles(tokenObj.sprite.x, tokenObj.sprite.y, 'birthday-token', {
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
      this.tokenCountText.setText(`✨ Token: ${this.tokensCollected}/${this.totalTokens}`);
      
      this.tweens.add({
        targets: this.tokenCountText,
        scale: 1.3,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut'
      });
    }
    
    if (this.tokensCollected === this.totalTokens && this.questText) {
      this.questText.setText('🎉 Quest Selesai! Bicara dengan NPC!');
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
