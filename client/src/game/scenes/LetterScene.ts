import Phaser from 'phaser';

export default class LetterScene extends Phaser.Scene {
  private letter?: Phaser.GameObjects.Image;
  private tapText?: Phaser.GameObjects.Text;
  private canProceed: boolean = false;
  private slideSound?: Phaser.Sound.BaseSound;
  private clickHandled: boolean = false;
  private sparkleParticles: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private proceedButton?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'LetterScene' });
  }

  preload() {
    this.load.image('letter', '/assets/letter.png');
    this.load.audio('letter-slide', '/sounds/success.mp3');
    
    this.createSparkleTexture();
  }

  private createSparkleTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFD700, 1);
    graphics.fillCircle(4, 4, 3);
    graphics.fillRect(2, 4, 4, 1);
    graphics.fillRect(4, 2, 1, 4);
    graphics.generateTexture('sparkle', 8, 8);
    graphics.destroy();
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.clickHandled = false;

    this.createParallaxBackground(width, height);

    // Create letter - start from top (off screen)
    this.letter = this.add.image(width / 2, -300, 'letter');
    
    // Set origin to center
    this.letter.setOrigin(0.5, 0.5);
    
    // Scale the letter to fit nicely on screen
    const maxWidth = width * 0.85;
    const maxHeight = height * 0.85;
    
    const letterScale = Math.min(maxWidth / this.letter.width, maxHeight / this.letter.height);
    this.letter.setScale(letterScale);

    console.log('Letter created at position:', this.letter.x, this.letter.y);
    console.log('Letter scale:', letterScale);
    console.log('Screen size:', width, height);

    // Play sound
    this.slideSound = this.sound.add('letter-slide', { volume: 0.4 });
    this.slideSound.play();

    // Animate letter sliding down to center - INSTANT (150ms max)
    this.tweens.add({
      targets: this.letter,
      y: height / 2,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        console.log('Letter animation complete. Final position:', this.letter?.x, this.letter?.y);
        this.canProceed = true;
        this.showTapText();
      }
    });
  }

  private createParallaxBackground(width: number, height: number) {
    const bg1 = this.add.rectangle(0, 0, width, height, 0xf5e6d3);
    bg1.setOrigin(0, 0);
    
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFD700, 0.05);
    
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(20, 60);
      
      graphics.fillCircle(x, y, size);
    }
    
    const bg2 = this.add.rectangle(0, 0, width, height, 0xFFE4B5, 0.1);
    bg2.setOrigin(0, 0);
    
    this.tweens.add({
      targets: bg2,
      alpha: 0.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createSparkleEffect() {
    if (!this.letter) return;
    
    const positions = [
      { x: this.letter.x - this.letter.displayWidth / 3, y: this.letter.y - this.letter.displayHeight / 3 },
      { x: this.letter.x + this.letter.displayWidth / 3, y: this.letter.y - this.letter.displayHeight / 3 },
      { x: this.letter.x - this.letter.displayWidth / 3, y: this.letter.y + this.letter.displayHeight / 3 },
      { x: this.letter.x + this.letter.displayWidth / 3, y: this.letter.y + this.letter.displayHeight / 3 },
    ];
    
    positions.forEach((pos, index) => {
      this.time.delayedCall(index * 150, () => {
        const emitter = this.add.particles(pos.x, pos.y, 'sparkle', {
          speed: { min: 50, max: 100 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.2, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 600,
          quantity: 8,
          frequency: -1
        });
        
        emitter.setDepth(999);
        emitter.explode(8);
        
        this.sparkleParticles.push(emitter);
        
        this.time.delayedCall(1000, () => {
          emitter.destroy();
        });
      });
    });
  }

  private showTapText() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const buttonBg = this.add.rectangle(0, 0, 320, 60, 0xFF6B9D, 1);
    buttonBg.setStrokeStyle(3, 0xFFFFFF);
    
    const buttonText = this.add.text(0, 0, '🎮 Mulai Permainan 🎮', {
      fontSize: '22px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);
    
    this.proceedButton = this.add.container(width / 2, height - 80, [buttonBg, buttonText]);
    this.proceedButton.setDepth(100);
    // Show button immediately - no fade in animation
    this.proceedButton.setAlpha(1);
    this.proceedButton.setScale(1);
    
    this.tweens.add({
      targets: this.proceedButton,
      y: height - 85,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    buttonBg.setInteractive({ useHandCursor: true });
    
    buttonBg.on('pointerover', () => {
      this.tweens.add({
        targets: this.proceedButton,
        scale: 1.1,
        duration: 200,
        ease: 'Back.easeOut'
      });
    });
    
    buttonBg.on('pointerout', () => {
      this.tweens.add({
        targets: this.proceedButton,
        scale: 1,
        duration: 200
      });
    });
    
    buttonBg.once('pointerdown', () => {
      if (this.canProceed && !this.clickHandled) {
        this.clickHandled = true;
        this.canProceed = false;
        console.log('Proceeding to RPG Scene');
        
        // Instant transition - no delays or animations
        this.scene.start('RPGScene');
      }
    });
  }
}
