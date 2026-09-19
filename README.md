<h1 align="center">Binni Cordova</h1>

<p align="center">
  <strong>Senior Software Engineer · Mobile Architect</strong><br>
  React Native · Swift · Kotlin · Node · AWS · multi-agent systems in production
</p>

<p align="center">
  Currently @ <strong>The Coca-Cola Company</strong> · open to Senior &amp; Staff roles in 🇨🇦 Canada · 🇺🇸 USA · 🇪🇺 Europe
</p>

<p align="center">
  <a href="https://binnicordova.com">
    <img src=".github/media/site.gif" width="820" alt="binnicordova.com: an iPhone flies through eight legs of shipped work — miMarket at Coca-Cola, NFL+, Itaú, Platanitos — then the device delaminates into the six layers it is made of, labelled bridge, native modules, offline store, backend-for-frontend, cloud and agents.">
  </a>
</p>

<p align="center">
  <a href="https://binnicordova.com"><strong>binnicordova.com</strong></a><br>
  <sub>Eight years of shipped mobile as one continuous flight. Every screen in it is a real production recording.</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Open%20to-Sponsorship%20%26%20Relocation-e8935c?style=flat-square" alt="Open to sponsorship and relocation">
  <img src="https://img.shields.io/badge/Focus-Agentic%20%26%20Spec--Driven%20Development-44e2cd?style=flat-square" alt="Focus: agentic and spec-driven development">
  <a href="https://www.npmjs.com/~binnizenobiocordovaleandro"><img src="https://img.shields.io/badge/npm-packages%20published-cb0000?style=flat-square&logo=npm&logoColor=white" alt="Packages published on npm"></a>
  <img src="https://img.shields.io/badge/Languages-ES%20%C2%B7%20EN%20%C2%B7%20IT%20%C2%B7%20FR%20%C2%B7%20DE-8892b0?style=flat-square" alt="Languages: Spanish, English, Italian, French, German">
</p>

---

### Agents work my stack now

At Coca-Cola I configured and operate a multi-agent system on **LangGraph** and the **Claude Agent SDK** that picks up front-end and back-end tickets and works them. Every change it makes is reviewed and signed off by me, as the accountable engineer.

| | |
|---|---|
| **Claude Code** | daily driver, front end and back end |
| **Claude Agent SDK · LangGraph** | multi-agent orchestration in production |
| **Codex CLI** | second opinion on diagnosis |
| **Cursor** | in-editor work |
| **TensorFlow Lite** | on-device inference |

Spec-driven development, AI-assisted diagnosis, prompt engineering — with eight years of shipping underneath it, which is what makes the review worth anything.

---

### Shipped

| Product | Role | Reach |
|---|---|---|
| **miMarket** — Coca-Cola | Senior Full Stack · Apr 2025 – present | 1,500+ sellers across 5 South American markets, 1.35M+ orders/month |
| **[NFL+](https://apps.apple.com/us/app/nfl/id389781154)** | Senior Software Engineer · Feb 2024 – Mar 2025 | millions of viewers — mobile, web, CTV |
| **[Itaú](https://apps.apple.com/cl/app/itu-cuenta-corriente-digital/id1620586910)** | Software Engineer · Dec 2021 – Feb 2024 | 100K+ on a secure banking app, 90%+ automated coverage |
| **[Platanitos](https://apps.apple.com/pe/app/platanitos/id1093153586)** | Full Stack · Mar 2019 – Dec 2021 | 1M+ downloads, one codebase to iOS, Android, Huawei |
| **[Gruppo GPI](https://www.gpigroup.com/)** | Software Engineer · Mar 2018 – Mar 2019 | 3,000+ hospitals and clinics across Europe |

miMarket is B2B field sales: 1,500+ sellers across Peru, Chile, Argentina, Paraguay and Brazil place more than 1,350,000 orders a month to Coca-Cola clients. Offline-first on WatermelonDB, because the field is where the signal is not, and it runs in Spanish and in Portuguese. Internal distribution only — it carries client records, so it ships to field devices under company control.

One React Native and TheoPlayer video player across phones, the web and smart TVs. Recoil retired for Jotai, native modules moved to Expo inside a Turborepo, bridge traffic cut until the thing started fast.

---

### Native modules on npm

Everything above you have to take my word for. These you can install.

I write native iOS and Android modules for a living — biometrics, encrypted storage, hardware the JavaScript bridge cannot reach. The ones that are not somebody's private property, I publish, and I hold them to the same bar as the banking work they came out of.

#### [`react-native-check-biometric-changed`](https://www.npmjs.com/package/react-native-check-biometric-changed)

[![npm](https://img.shields.io/npm/v/react-native-check-biometric-changed?style=flat-square&color=cb0000&label=npm)](https://www.npmjs.com/package/react-native-check-biometric-changed)
[![downloads](https://img.shields.io/npm/dt/react-native-check-biometric-changed?style=flat-square&color=8892b0&label=installs)](https://www.npmjs.com/package/react-native-check-biometric-changed)
[![repo](https://img.shields.io/badge/source-GitHub-8892b0?style=flat-square&logo=github&logoColor=white)](https://github.com/binnicordova/react-native-check-biometric-changed)

**Same device, different human.** A session granted to one face should not survive re-enrolment by another. This answers whether the biometric protecting a session is still the one enrolled when the session was granted — so the app can revoke it before a newly enrolled face or fingerprint inherits it.

Swift and Kotlin, straight out of the Itaú banking work. Zero runtime dependencies, autolinked, iOS 10+ and Android 23+. Past **1,000 installs**.

```sh
npm install react-native-check-biometric-changed
```

#### Also published

| Package | | |
|---|---|---|
| [`expo-feedback-ai`](https://www.npmjs.com/package/expo-feedback-ai) | An in-app feature-request board whose most-voted ideas get built by an AI agent. No backend, no API key, runs in Expo Go. | [![npm](https://img.shields.io/npm/v/expo-feedback-ai?style=flat-square&color=cb0000&label=npm)](https://www.npmjs.com/package/expo-feedback-ai) |
| [`iphone-duo-expo-rn`](https://www.npmjs.com/package/iphone-duo-expo-rn) | The iPhone "Duo" frosted-glass fold, driven by device motion. TypeScript only, no native code — iOS, Android and web. | [![npm](https://img.shields.io/npm/v/iphone-duo-expo-rn?style=flat-square&color=cb0000&label=npm)](https://www.npmjs.com/package/iphone-duo-expo-rn) |

All MIT, around **500 installs a month** across the set — [all of them on npm](https://www.npmjs.com/~binnizenobiocordovaleandro).

---

### Thirteen apps of my own

Nights and weekends, designed, built and shipped on my own: ride hailing, vehicle records, a résumé scorer, a beach-safety guide, a React drill app, a live-event film maker, a personal-safety network, a live-stream AI assistant.

They are live on Google Play under **BinniCordova.com** — [see the full list](https://play.google.com/store/apps/developer?id=BinniCordova.com). They also fly past in the last act of [binnicordova.com](https://binnicordova.com).

---

### Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,ts,swift,kotlin,java,nodejs,python,graphql,aws,gcp,firebase,docker,kubernetes,githubactions" alt="React Native, TypeScript, Swift, Kotlin, Java, Node.js, Python, GraphQL, AWS, Google Cloud, Firebase, Docker, Kubernetes, GitHub Actions">
</p>

- **Mobile** — React Native, Expo (managed and bare), Swift, Kotlin, New Architecture (JSI · TurboModules · Fabric), WatermelonDB
- **Architecture** — offline-first, backend-for-frontend, native modules, Keychain and Keystore, biometrics, SSL pinning
- **Cloud** — AWS Lambda in Python, multi-account and multi-environment, Firestore, Google Cloud, GraphQL, REST, WebSockets, SQL
- **State** — Redux, Zustand, Jotai, Recoil
- **Delivery** — Turborepo, pnpm, GitHub Actions, EAS, Bitrise, Jenkins, Docker, Kubernetes, OTA updates
- **Quality** — Jest, Detox, Appium, Datadog, New Relic
- **Open source** — npm package authoring and publishing, semantic versioning, autolinked iOS and Android modules, Expo Go compatible libraries

---

### Education and languages

- **Software Architecture Certification** — University TECSUP, Apr 2025 – Nov 2025
- **Bachelor's in Computer Science** — Tech Institute Trentino Juan Pablo II, Mar 2013 – Dec 2015

🇪🇸 Spanish **native** · 🇬🇧 English **advanced** · 🇮🇹 Italian **fluent** · 🇫🇷 French **basic** · 🇩🇪 German **basic**

---

<details>
<summary><strong>How this profile's site is built</strong></summary>

<br>

The GIF above is the real thing, not a mockup. [binnicordova.com](https://binnicordova.com) is one unbroken 3D world: an iPhone built entirely in CSS sits inside a scroll-driven camera and the reader flies through eight legs of it, in the order my résumé prints. At the peak the device body goes translucent and delaminates into the six planes it is actually made of, each labelled with the technology it really is — and the app keeps running through the whole move.

Every clip is a real production recording, cropped and scaled only. No pixel is altered anywhere in the pipeline.

It is verified rather than eyeballed: a harness walks the scroll track and asserts the copy never overshoots its cap, that no seam drops both legs at once, that the camera lerp converges without overshoot, and that a clip which cannot decode never takes the screen from the app's own frame. A second harness measures every line of copy against its worst frame on the composited page, using glyph rectangles rather than bounding boxes, and holds the whole page above 4.5:1.

Source is in this repository under `scrollcraft/builds/one-device/`.

</details>

---

### Reach me

<p align="center">
  <a href="https://binnicordova.com"><strong>binnicordova.com</strong></a> ·
  <a href="https://www.npmjs.com/~binnizenobiocordovaleandro">npm</a> ·
  <a href="https://www.linkedin.com/in/binnicordova">LinkedIn</a>
</p>

<p align="center">
  <a href="tel:+51971581847"><strong>+51 971 581 847</strong></a> ·
  <a href="mailto:binni.2000.cordova@gmail.com">binni.2000.cordova@gmail.com</a>
</p>

<p align="center">
  <sub>Open to visa sponsorship and employer relocation.</sub>
</p>
