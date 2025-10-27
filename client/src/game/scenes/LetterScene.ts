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

    // Background
    const background = this.add.rectangle(0, 0, width, height, 0xf5e6d3);
    background.setOrigin(0, 0);

    // Create letter - start from top (off screen)
    this.letter = this.add.image(width / 2, -300, 'letter');
    
    // Set origin to center (0.5, 0.5 is default but let's be explicit)
    this.letter.setOrigin(0.5, 0.5);
    
    // Scale the letter to fit nicely on screen
    // Keep aspect ratio and make it readable
    const maxWidth = width * 0.85;  // Increased from 0.7 to 0.85
    const maxHeight = height * 0.85; // Increased from 0.8 to 0.85
    
    const letterScale = Math.min(maxWidth / this.letter.width, maxHeight / this.letter.height);
    this.letter.setScale(letterScale);

    console.log('Letter created at position:', this.letter.x, this.letter.y);
    console.log('Letter scale:', letterScale);
    console.log('Screen size:', width, height);

    // Play sound
    this.slideSound = this.sound.add('letter-slide', { volume: 0.4 });
    this.slideSound.play();

    // Animate letter sliding down to center
    this.tweens.add({
      targets: this.letter,
      y: height / 2,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        console.log('Letter animation complete. Final position:', this.letter?.x, this.letter?.y);
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

    // Blinking animation
    this.tweens.add({
      targets: this.tapText,
      alpha: 0.5,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    // Click to proceed
    this.input.on('pointerdown', () => {
      if (this.canProceed) {
        this.canProceed = false;
        console.log('Proceeding to RPG Scene');
        this.scene.start('RPGScene');
      }
    });
  }
}
