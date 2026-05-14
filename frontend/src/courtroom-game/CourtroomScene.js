// Althing Mahkeme Sahnesi — scroll'lu diyalog kutusu
// Uzun metinler artık kutuda kalır, mouse tekerleğiyle aşağı/yukarı.
// Yazılırken otomatik en alt satıra iner.

import Phaser from 'phaser';

const ROLE_COLORS = {
  davaci: 0x2f6e6b,
  sanik: 0x7a1f1f,
  yargic: 0x4a2c5a,
};

const ROLE_LABELS = {
  davaci: 'MÜŞTEKİ',
  sanik: 'SANIK',
  yargic: 'YARGIÇ',
};

const EXPRESSIONS = {
  davaci: ['normal', 'konusuyor', 'sinirli', 'saskin'],
  sanik: ['normal', 'konusuyor', 'sinirli', 'saskin'],
  yargic: ['konusuyor', 'ciddi', 'sinirli', 'saskin', 'memnun', 'dusunceli', 'normal'],
};

const SPEAKING_PREF = {
  davaci: ['konusuyor', 'normal'],
  sanik: ['konusuyor', 'normal'],
  yargic: ['konusuyor', 'ciddi'],
};

const IDLE_PREF = {
  davaci: ['normal', 'konusuyor'],
  sanik: ['normal', 'konusuyor'],
  yargic: ['ciddi', 'normal', 'konusuyor'],
};

export default class CourtroomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CourtroomScene' });
    this.currentSpeaker = null;
    this.dialogText = '';
    this.typeIndex = 0;
    this.typeTimer = null;
    this.mouthTimer = null;
    this.characterImage = null;
    this.wheelHandler = null;
  }

  init(data) {
    this.initialState = data || {};
  }

  preload() {
    this.load.on('loaderror', (file) => {
      console.warn('[Sprite eksik]', file.src);
    });
    for (const role of Object.keys(EXPRESSIONS)) {
      for (const expr of EXPRESSIONS[role]) {
        this.load.image(`${role}-${expr}`, `/sprites/${role}/${expr}.png`);
      }
    }
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a1a10, 0x2a1a10, 0x4a3020, 0x4a3020, 1);
    bg.fillRect(0, 0, width, height);

    const panel = this.add.graphics();
    panel.fillStyle(0x1f120a, 1);
    panel.fillRect(0, 0, width, 44);
    panel.lineStyle(2, 0x6a4a2a, 0.6);
    panel.strokeRect(0, 0, width, 44);
    this.add.text(width / 2, 22, 'ALTHING MAHKEMESİ', {
      fontFamily: '"DM Serif Display", serif',
      fontSize: '18px',
      color: '#e6d9bb',
    }).setOrigin(0.5);

    this.characterContainer = this.add.container(width / 2, 340);

    const boxH = 260;
    const boxY = height - boxH - 16;
    const dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x14100c, 0.95);
    dialogBg.fillRect(20, boxY, width - 40, boxH);
    dialogBg.lineStyle(3, 0xc9a868, 1);
    dialogBg.strokeRect(20, boxY, width - 40, boxH);
    dialogBg.lineStyle(1, 0x8a7048, 0.7);
    dialogBg.strokeRect(28, boxY + 8, width - 56, boxH - 16);

    this.speakerNameText = this.add.text(36, boxY + 14, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      color: '#c9a868',
      fontStyle: 'bold',
    });

    // Yazı için klipleme alanı (mask)
    this.dialogTextOrigY = boxY + 42;
    this.dialogTextVisibleHeight = boxH - 56;
    this.dialogTextX = 36;
    this.dialogTextWidth = width - 80;

    this.dialogBoxText = this.add.text(this.dialogTextX, this.dialogTextOrigY, '', {
      fontFamily: '"Crimson Pro", Georgia, serif',
      fontSize: '20px',
      color: '#f1e8d4',
      wordWrap: { width: this.dialogTextWidth },
      lineSpacing: 6,
    });

    // Mask — yazı kutu dışına taşmasın
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(this.dialogTextX, this.dialogTextOrigY, this.dialogTextWidth, this.dialogTextVisibleHeight);
    this.dialogBoxText.setMask(maskShape.createGeometryMask());

    // Mouse tekerleği ile scroll
    this.wheelHandler = (e) => {
      if (!this.dialogBoxText) return;
      const overflow = this.dialogBoxText.height - this.dialogTextVisibleHeight;
      if (overflow <= 0) return; // taşma yoksa sayfayı kaydır
      e.preventDefault();
      this.dialogBoxText.y -= e.deltaY * 0.4;
      this.dialogBoxText.y = Phaser.Math.Clamp(
        this.dialogBoxText.y,
        this.dialogTextOrigY - overflow,
        this.dialogTextOrigY
      );
    };
    this.scale.canvas.addEventListener('wheel', this.wheelHandler, { passive: false });

    // Aşağı ok göstergesi (yazı taştığında "devamı var" işareti)
    this.dialogTriangle = this.add.triangle(
      width - 44, boxY + boxH - 24,
      0, 0, 16, 0, 8, 14,
      0xc9a868
    );
    this.tweens.add({
      targets: this.dialogTriangle,
      alpha: { from: 0.3, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
    this.dialogTriangle.setVisible(false);

    this.events.on('shutdown', () => {
      if (this.wheelHandler) {
        this.scale.canvas.removeEventListener('wheel', this.wheelHandler);
        this.wheelHandler = null;
      }
    });

    this.applyState(this.initialState);
  }

  applyState({ speakerRole, speakerName, dialogText }) {
    if (speakerRole && speakerRole !== this.currentSpeaker) {
      this.swapCharacter(speakerRole, speakerName);
    } else if (speakerRole && speakerName && this.speakerNameText) {
      this.speakerNameText.setText(`${ROLE_LABELS[speakerRole] || ''} · ${(speakerName || '').toUpperCase()}`);
    }
    if (dialogText !== undefined && dialogText !== this.dialogText) {
      this.startTypewriter(dialogText || '');
    }
  }

  findTexture(role, prefList) {
    for (const expr of prefList) {
      const key = `${role}-${expr}`;
      if (this.textures.exists(key)) return key;
    }
    return null;
  }

  swapCharacter(role, name) {
    if (!this.characterContainer) return;
    this.currentSpeaker = role;
    this.characterContainer.removeAll(true);
    this.characterImage = null;

    const speakingKey = this.findTexture(role, SPEAKING_PREF[role] || []);

    if (speakingKey) {
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.4);
      shadow.fillEllipse(0, 290, 380, 28);

      const img = this.add.image(0, 0, speakingKey);
      const maxH = 560;
      const maxW = 820;
      const scale = Math.min(maxH / img.height, maxW / img.width, 2.5);
      img.setScale(scale);
      img.setOrigin(0.5, 0.5);
      this.characterImage = img;

      this.characterContainer.add([shadow, img]);
    } else {
      const color = ROLE_COLORS[role] || 0x666666;
      const w = 320, h = 240;
      const podium = this.add.graphics();
      podium.fillStyle(0x000000, 0.4);
      podium.fillEllipse(0, h / 2 + 18, w * 0.9, 22);
      const charBox = this.add.graphics();
      charBox.fillStyle(color, 1);
      charBox.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      charBox.lineStyle(4, 0xf1e8d4, 0.9);
      charBox.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      const roleLabel = this.add.text(0, -h / 2 + 30, ROLE_LABELS[role] || '', {
        fontFamily: '"JetBrains Mono", monospace', fontSize: '16px', color: '#f1e8d4',
      }).setOrigin(0.5);
      const charName = this.add.text(0, 12, name || '—', {
        fontFamily: '"DM Serif Display", serif', fontSize: '38px', color: '#f7f0dd',
      }).setOrigin(0.5);
      this.characterContainer.add([podium, charBox, roleLabel, charName]);
    }

    this.characterContainer.setAlpha(0);
    this.characterContainer.setY(310);
    this.tweens.add({
      targets: this.characterContainer,
      alpha: 1,
      y: 340,
      duration: 280,
      ease: 'Cubic.Out',
    });

    if (this.speakerNameText) {
      this.speakerNameText.setText(`${ROLE_LABELS[role] || ''} · ${(name || '').toUpperCase()}`);
    }
  }

  switchToIdle() {
    if (!this.characterImage || !this.currentSpeaker) return;
    const idleKey = this.findTexture(this.currentSpeaker, IDLE_PREF[this.currentSpeaker] || []);
    if (idleKey && idleKey !== this.characterImage.texture.key) {
      this.characterImage.setTexture(idleKey);
    }
  }

  // Yazı taştığında alt satıra kayar (typewriter çalışırken sürekli)
  scrollToBottom() {
    if (!this.dialogBoxText) return;
    const overflow = this.dialogBoxText.height - this.dialogTextVisibleHeight;
    if (overflow > 0) {
      this.dialogBoxText.y = this.dialogTextOrigY - overflow;
      if (this.dialogTriangle) this.dialogTriangle.setVisible(true);
    } else {
      if (this.dialogTriangle) this.dialogTriangle.setVisible(false);
    }
  }

  startTypewriter(fullText) {
    this.dialogText = fullText;
    this.typeIndex = 0;

    if (this.typeTimer) {
      this.typeTimer.remove();
      this.typeTimer = null;
    }
    if (this.mouthTimer) {
      this.mouthTimer.remove();
      this.mouthTimer = null;
    }

    if (this.dialogBoxText) {
      this.dialogBoxText.setText('');
      this.dialogBoxText.y = this.dialogTextOrigY; // scroll'u sıfırla
    }
    if (this.dialogTriangle) this.dialogTriangle.setVisible(false);

    // Ağız animasyonu
    if (this.characterImage && this.currentSpeaker) {
      const speakingKey = this.findTexture(this.currentSpeaker, SPEAKING_PREF[this.currentSpeaker] || []);
      const idleKey = this.findTexture(this.currentSpeaker, IDLE_PREF[this.currentSpeaker] || []);
      if (speakingKey && idleKey && speakingKey !== idleKey) {
        let openMouth = true;
        this.characterImage.setTexture(speakingKey);
        this.mouthTimer = this.time.addEvent({
          delay: 220,
          loop: true,
          callback: () => {
            openMouth = !openMouth;
            if (this.characterImage) {
              this.characterImage.setTexture(openMouth ? speakingKey : idleKey);
            }
          },
        });
      }
    }

    if (!fullText || fullText.length === 0) return;

    this.typeTimer = this.time.addEvent({
      delay: 22,
      repeat: fullText.length - 1,
      callback: () => {
        this.typeIndex++;
        if (this.dialogBoxText) {
          this.dialogBoxText.setText(fullText.slice(0, this.typeIndex));
          this.scrollToBottom();
        }
        if (this.typeIndex >= fullText.length) {
          if (this.mouthTimer) {
            this.mouthTimer.remove();
            this.mouthTimer = null;
          }
          this.switchToIdle();
        }
      },
    });
  }
}