import Phaser from 'phaser';

export default class HugScene extends Phaser.Scene {
  private hugImage?: Phaser.GameObjects.Image;
  private messageText?: Phaser.GameObjects.Text;
  private canProceed: boolean = false;

  constructor() {
    super({ key: 'HugScene' });
  }

  preload() {
    this.load.image('hug-scene', '/assets/hug-scene.png');
    this.load.audio('happy-music', '/sounds/success.mp3');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const background = this.add.rectangle(0, 0, width, height, 0xFFE4E1);
    background.setOrigin(0, 0);

    this.cameras.main.fadeIn(800, 255, 228, 225);

    this.hugImage = this.add.image(width / 2, height / 2 - 50, 'hug-scene');
    this.hugImage.setScale(0);
    
    const imageScale = Math.min(
      (width * 0.6) / this.hugImage.width,
      (height * 0.5) / this.hugImage.height
    );

    this.tweens.add({
      targets: this.hugImage,
      scale: imageScale,
      duration: 1000,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.showMessage();
      }
    });

    const hearts = this.add.particles(width / 2, height / 2, 'heart-sprite', {
      speed: { min: 50, max: 100 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 2000,
      frequency: 300,
      blendMode: 'ADD'
    });
    hearts.setDepth(5);

    this.sound.play('happy-music', { volume: 0.5 });

    this.time.delayedCall(1500, () => {
      this.createFloatingHearts();
    });
  }

  private showMessage() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.messageText = this.add.text(
      width / 2,
      height - 150,
      '💖 Selamat Ulang Tahun Kayla! 💖\n\nTerima kasih sudah menemukan semua hati.\nSemoga hari-harimu selalu dipenuhi cinta dan kebahagiaan!',
      {
        fontSize: '20px',
        color: '#FF1744',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#FFFFFF',
        padding: { x: 20, y: 15 },
        wordWrap: { width: width - 100 }
      }
    );
    this.messageText.setOrigin(0.5);
    this.messageText.setAlpha(0);

    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 1000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.canProceed = true;
        this.showTapText();
      }
    });
  }

  private showTapText() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const tapText = this.add.text(
      width / 2,
      height - 60,
      'Tap untuk restart',
      {
        fontSize: '18px',
        color: '#888888',
        fontFamily: 'Arial'
      }
    );
    tapText.setOrigin(0.5);

    this.tweens.add({
      targets: tapText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.input.once('pointerdown', () => {
      if (this.canProceed) {
        this.cameras.main.fadeOut(500, 255, 228, 225);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('EnvelopeScene');
        });
      }
    });
  }

  private createFloatingHearts() {
    const width = this.cameras.main.width;
    
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(100, 300);
      
      const heart = this.add.image(x, y, 'heart-sprite');
      heart.setScale(0.5);
      heart.setAlpha(0.3);
      heart.setDepth(1);
      
      this.tweens.add({
        targets: heart,
        y: y - 30,
        alpha: 0.6,
        duration: 2000 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.tweens.add({
        targets: heart,
        angle: 360,
        duration: 4000,
        repeat: -1,
        ease: 'Linear'
      });
    }
  }
}
