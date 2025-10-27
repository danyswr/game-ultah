import Phaser from 'phaser';

export default class LetterScene extends Phaser.Scene {
  private letter?: Phaser.GameObjects.Image;
  private tapText?: Phaser.GameObjects.Text;
  private canProceed: boolean = false;
  private slideSound?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'LetterScene' });
  }

  preload() {
    this.load.image('letter', '/assets/letter.png');
    this.load.audio('letter-slide', '/sounds/success.mp3');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const background = this.add.rectangle(0, 0, width, height, 0xf5e6d3);
    background.setOrigin(0, 0);

    this.letter = this.add.image(width / 2, -400, 'letter');
    this.letter.setOrigin(0.5, 0.5); // Set origin to center
    this.letter.setDisplaySize(Math.min(width * 0.8, 500), Math.min(width * 0.8 * 1.5, 750));

    this.slideSound = this.sound.add('letter-slide', { volume: 0.4 });
    this.slideSound.play();

    this.tweens.add({
      targets: this.letter,
      y: height / 2,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.canProceed = true;
        this.showTapText();
      }
    });
  }

  private showTapText() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.tapText = this.add.text(width / 2, height - 80, 'Tap untuk melanjutkan ke permainan', {
      fontSize: '20px',
      color: '#8B4513',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 }
    });
    this.tapText.setOrigin(0.5);

    this.tweens.add({
      targets: this.tapText,
      alpha: 0.5,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    this.input.on('pointerdown', () => {
      if (this.canProceed) {
        this.canProceed = false;
        this.scene.start('RPGScene');
      }
    });
  }
}
