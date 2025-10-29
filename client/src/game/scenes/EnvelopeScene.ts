import Phaser from 'phaser';

export default class EnvelopeScene extends Phaser.Scene {
  private currentFrame: number = 0;
  private envelopeSprites: Phaser.GameObjects.Sprite[] = [];
  private animating: boolean = false;
  private tapText?: Phaser.GameObjects.Text;
  private openSound?: Phaser.Sound.BaseSound;
  private confettiParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'EnvelopeScene' });
  }

  preload() {
    this.load.spritesheet('envelope-animation', '/assets/envelope-spritesheet.png', {
      frameWidth: 341,
      frameHeight: 341
    });
    this.load.audio('envelope-open', '/sounds/success.mp3');
    
    this.createConfettiTexture();
  }

  private createConfettiTexture() {
    const graphics = this.add.graphics();
    const colors = [0xFF1744, 0xF50057, 0xD500F9, 0x651FFF, 0x3D5AFE, 0x2979FF, 0x00B0FF, 0x00E5FF, 0x1DE9B6, 0x00E676, 0x76FF03, 0xC6FF00, 0xFFEA00, 0xFFC400, 0xFF9100, 0xFF3D00];
    
    colors.forEach((color, index) => {
      graphics.clear();
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, 8, 8);
      graphics.generateTexture(`confetti${index}`, 8, 8);
    });
    
    graphics.destroy();
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const background = this.add.rectangle(0, 0, width, height, 0xf5e6d3);
    background.setOrigin(0, 0);

    // Create animated sprite using the spritesheet with scale animation
    const envelopeSprite = this.add.sprite(width / 2, height / 2, 'envelope-animation');
    envelopeSprite.setOrigin(0.5, 0.5);
    envelopeSprite.setDisplaySize(400, 400);
    
    // Add gentle floating animation to envelope
    this.tweens.add({
      targets: envelopeSprite,
      y: height / 2 - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Set to frame 0 (closed envelope)
    envelopeSprite.setFrame(0);
    
    // Create animation with 9 frames - Super smooth animation
    if (!this.anims.exists('envelope-open')) {
      this.anims.create({
        key: 'envelope-open',
        frames: this.anims.generateFrameNumbers('envelope-animation', { start: 0, end: 8 }),
        frameRate: 24, // Increased to 24 FPS for super smooth animation
        repeat: 0, // Play only once
        hideOnComplete: false // Keep last frame visible
      });
    }
    
    this.envelopeSprites.push(envelopeSprite);

    this.tapText = this.add.text(width / 2, height - 100, 'Tap untuk membuka surat', {
      fontSize: '24px',
      color: '#8B4513',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.tapText.setOrigin(0.5);

    this.tweens.add({
      targets: this.tapText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.openSound = this.sound.add('envelope-open', { volume: 0.5 });

    // Use once to prevent multiple calls
    this.input.once('pointerdown', () => {
      if (!this.animating) {
        this.playAnimation();
      }
    });
  }

  private playAnimation() {
    this.animating = true;
    
    if (this.tapText) {
      this.tapText.setVisible(false);
    }

    this.openSound?.play();

    const sprite = this.envelopeSprites[0];
    
    console.log('Starting envelope animation');
    
    this.cameras.main.zoomTo(1.15, 400, 'Cubic.easeInOut');
    
    sprite.stop();
    sprite.play('envelope-open');
    
    sprite.once('animationcomplete', () => {
      console.log('Envelope animation complete - adding celebration effects');
      
      sprite.stop();
      
      this.createScreenFlash();
      this.createConfettiExplosion();
      
      this.time.delayedCall(100, () => {
        this.cameras.main.fadeOut(150, 245, 230, 211);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('LetterScene');
        });
      });
    });
  }

  private createScreenFlash() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xFFFFFF, 0);
    flash.setDepth(1000);
    
    this.tweens.add({
      targets: flash,
      alpha: 0.6,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  private createConfettiExplosion() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    for (let i = 0; i < 16; i++) {
      const confettiTexture = `confetti${i}`;
      
      const emitter = this.add.particles(width / 2, height / 2, confettiTexture, {
        speed: { min: 200, max: 400 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0.5 },
        alpha: { start: 1, end: 0 },
        lifespan: 2000,
        gravityY: 300,
        rotate: { min: 0, max: 360 },
        frequency: -1,
        quantity: 3
      });
      
      emitter.setDepth(999);
      emitter.explode(3);
      
      this.time.delayedCall(2500, () => {
        emitter.destroy();
      });
    }
  }
}
