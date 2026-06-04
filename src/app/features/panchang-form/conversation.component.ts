import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceService } from '../../services/voice.service';
import { SankalpamService } from '../../services/sankalpam.service';
import { UserDetails, SankalpamRequest } from '../../core/types/api.models';

enum Step {
  Init,
  AskName,
  AskGotra,
  AskPurpose,
  Processing,
  SpeakingResult,
  Completed
}

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent implements OnInit {

private cd = inject(ChangeDetectorRef);
  private voice = inject(VoiceService);
  private sankalpamService = inject(SankalpamService);

  // 🔥 SESSION CONTROL (CRITICAL FIX)
  private sessionId = 0;

  @ViewChild('audioPlayer', { static: false }) private audioPlayer?: ElementRef<HTMLAudioElement>;

  audioSrc: string | null = null;
  speechTextToPlay: string | null = null;
  isAudioPlaying = false;

  step: Step = Step.Init;
  isRestarting = false;

  name = '';
  gotra = '';
  purpose = '';

  responseText = '';
  statusMessage = '';

  isListening = false;
  isSpeaking = false;

 ngOnInit() {

    this.voice.isListening$.subscribe(v => {
      setTimeout(() => {
        this.isListening = v;
        this.cd.detectChanges();
      });
    });

    this.voice.isSpeaking$.subscribe(v => {
      setTimeout(() => {
        this.isSpeaking = v;
        this.cd.detectChanges();
      });
    });

    setTimeout(() => {
      this.startConversation();
    });
  }
  // SESSION MANAGEMENT
  // =========================
  private createSession(): number {
    this.sessionId++;
    return this.sessionId;
  }

  private isValidSession(session: number): boolean {
    return this.sessionId === session;
  }

  // =========================
  // MAIN FLOW
  // =========================
  async startConversation() {

    const session = this.createSession();

    try {
      await this.askName(session);
      await this.askGotra(session);
      await this.askPurpose(session);
      await this.process(session);
      
    } catch (e) {
      this.statusMessage = 'An error occurred while running the conversation. Please try again.';
    }
  }

  // =========================
  // STEPS (SESSION SAFE)
  // =========================

 async askName(session: number) {

  if (!this.isValidSession(session)) return;

  this.step = Step.AskName;

  const prompt = this.buildPrompt('name');

  this.statusMessage = prompt;
this.cd.detectChanges();
  await this.voice.speak(prompt);

  if (!this.isValidSession(session)) return;

  const result = await this.voice.listen();

  if (!this.isValidSession(session)) return;

  this.name = result || 'Devotee';
}

 async askGotra(session: number) {

  if (!this.isValidSession(session)) return;

  this.step = Step.AskGotra;

  const prompt = this.buildPrompt('gotra');

  this.statusMessage = prompt;
this.cd.detectChanges();
  await this.voice.speak(prompt);

  if (!this.isValidSession(session)) return;

  const result = await this.voice.listen();

  this.gotra = result || 'Unknown Gotra';
}
async askPurpose(session: number) {

  if (!this.isValidSession(session)) return;

  this.step = Step.AskPurpose;

  const prompt = this.buildPrompt('purpose');

  this.statusMessage = prompt;
  this.cd.detectChanges();

  await this.voice.speak(prompt);

  if (!this.isValidSession(session)) return;

  const result = await this.voice.listen();

  this.purpose = result || 'General well-being';
}
  async process(session: number) {

    if (!this.isValidSession(session)) return;

    this.step = Step.Processing;
    this.updateStatusMessage();

    await this.voice.speak('Processing your sankalpam');

    if (!this.isValidSession(session)) return;

    const response = await this.generateSankalpam();

    if (!this.isValidSession(session)) return;

    this.responseText = response;

    this.step = Step.SpeakingResult;
    this.updateStatusMessage();

    if (!this.audioSrc && this.speechTextToPlay) {
      // audio will be played by button click using browser TTS fallback
    }

    if (!this.isValidSession(session)) return;

    this.step = Step.Completed;
    this.updateStatusMessage();
  }

  async playAudio(): Promise<void> {
    if (this.audioSrc && this.audioPlayer?.nativeElement) {
      try {
        await this.audioPlayer.nativeElement.play();
        this.isAudioPlaying = true;
      } catch {
        this.isAudioPlaying = false;
      }
      return;
    }

    if (this.speechTextToPlay) {
      try {
        this.isAudioPlaying = true;
        await this.voice.speak(this.speechTextToPlay);
      } catch {
        // ignore playback errors
      } finally {
        this.isAudioPlaying = false;
      }
    }
  }

  onAudioEnded(): void {
    this.isAudioPlaying = false;
  }

  // =========================
  // STATUS
  // =========================
  private updateStatusMessage() {

    switch (this.step) {

      case Step.AskName:
        this.statusMessage = this.random([
          '🙏 Please say your name',
          '✨ Tell me your name',
          '🕉️ Who is performing the sankalpam?'
        ]);
        break;

      case Step.AskGotra:
        this.statusMessage = this.random([
          '🧬 Please say your gotra',
          '✨ Tell me your lineage',
          '🕉️ Which gotra do you belong to?'
        ]);
        break;

      case Step.AskPurpose:
        this.statusMessage = this.random([
          '🎯 What is your purpose?',
          '🙏 Tell your intention',
          '✨ What blessing are you seeking?'
        ]);
        break;

      case Step.Processing:
        this.statusMessage = this.random([
          '🌀 Aligning with divine energies...',
          '✨ Preparing your sankalpam...',
          '🔮 Reading cosmic alignment...'
        ]);
        break;

      case Step.SpeakingResult:
        this.statusMessage = this.random([
          '🔊 Divine message is being spoken...',
          '🕉️ Receiving sacred words...',
          '✨ Blessings are flowing...'
        ]);
        break;

      case Step.Completed:
        this.statusMessage = '✅ Sankalpam completed';
        break;

      default:
        this.statusMessage = '';
    }
  }

  private random(list: string[]): string {
    return list[Math.floor(Math.random() * list.length)];
  }

  // =========================
  // MOCK API
  // =========================
  async generateSankalpam(): Promise<string> {

    // Build minimal user details payload from collected inputs
    const userDetails: UserDetails = {
      fullName: this.name || 'Devotee',
      gotra: this.gotra || 'Unknown',
      gender: 'Other',
      date: new Date().toISOString(),
      locationName: '',
      latitude: 0,
      longitude: 0,
      intention: this.purpose || ''
    };

    const request: SankalpamRequest = {
      userDetails,
      panchangam: {
        tithi: '',
        nakshatra: '',
        yoga: '',
        karana: '',
        masa: '',
        ayana: '',
        ritu: '',
        samvatsara: ''
      },
      language: (this.voice as any).langService?.getLanguage?.() || 'en-IN'
    };

    try {
      const result = await this.sankalpamService.generateSankalpam(request);
      const sankalpamText = result.sankalpaTemplate || '';
      this.speechTextToPlay = sankalpamText || null;
      this.audioSrc = result.audioUrl?.trim() || null;
      return sankalpamText;
    } catch (e) {
      this.speechTextToPlay = `Om Sri Maha Ganapataye Namaha 🙏\n\n${this.name} of ${this.gotra} gotra, is performing Sankalpam for ${this.purpose}.`;
      return this.speechTextToPlay;
    }
  }

  // =========================
  // RESTART (FULL FIX)
  // =========================
  async restart() {

    if (this.isRestarting) return;

    this.isRestarting = true;

    try {

      // 🛑 stop voice immediately
      this.voice.stop();

      // ❗ invalidate ALL previous flows
      this.sessionId++;

      // reset UI
      this.step = Step.Init;

      this.name = '';
      this.gotra = '';
      this.purpose = '';

      this.responseText = '';
      this.audioSrc = null;
      this.speechTextToPlay = null;

      this.statusMessage = '✨ Preparing new session...';

      await new Promise(res => setTimeout(res, 300));

      this.startConversation();

    } finally {
      this.isRestarting = false;
    }
  }

  private buildPrompt(type: 'name' | 'gotra' | 'purpose'): string {

  const lang = this.voice['langService'].getLanguage();

  const prompts: any = {

    'en-IN': {
      name: [
        '🙏 Please tell me your name',
        '✨ May I know your name?',
        '🕉️ Who is performing the sankalpam?'
      ],
      gotra: [
        `🧬 ${this.name}, please tell your gotra`,
        '✨ Tell me your lineage',
        '🕉️ Which gotra do you belong to?'
      ],
      purpose: [
        '🎯 What is your purpose today?',
        '🙏 Tell your intention',
        '✨ What blessing are you seeking?'
      ]
    },

    'te-IN': {
      name: [
        '🙏 మీ పేరు చెప్పండి',
        '✨ మీ పేరు ఏమిటి?',
        '🕉️ సంకల్పం ఎవరు చేస్తున్నారు?'
      ],
      gotra: [
        `${this.name}, మీ గోత్రం చెప్పండి`,
        '🧬 మీ వంశం ఏమిటి?',
        '🕉️ మీరు ఏ గోత్రానికి చెందారు?'
      ],
      purpose: [
        '🎯 మీ సంకల్పం ఉద్దేశ్యం ఏమిటి?',
        '🙏 మీరు కోరుకునే ఆశయం ఏమిటి?',
        '✨ మీరు ఏ ఆశీర్వాదం కోరుతున్నారు?'
      ]
    },

    'hi-IN': {
      name: [
        '🙏 कृपया अपना नाम बताएं',
        '✨ आपका नाम क्या है?',
        '🕉️ संकल्प कौन कर रहा है?'
      ],
      gotra: [
        `${this.name}, अपना गोत्र बताएं`,
        '🧬 आपकी वंश परंपरा क्या है?',
        '🕉️ आप किस गोत्र से हैं?'
      ],
      purpose: [
        '🎯 आपका उद्देश्य क्या है?',
        '🙏 आप क्या संकल्प कर रहे हैं?',
        '✨ आप कौन सा आशीर्वाद चाहते हैं?'
      ]
    }
  };

  const list = prompts[lang]?.[type] || prompts['en-IN'][type];

  return list[Math.floor(Math.random() * list.length)];
}
}