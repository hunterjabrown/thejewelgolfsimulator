# The Jewel Golf Simulator

Built in an afternoon so my apartment building's golf community can see if someone is on the sim before walking down.

If it's free, walk down. If someone's on it, wait. That's the whole app.

**Live:** https://thejewelgolfsimulator.vercel.app

## Stack

Next.js, TypeScript, Tailwind, Vercel. Session data in Upstash Redis.

There's a QR code in the lobby that links to the live page. Flyer's in the repo too. Usage stats at `/dashboard` (not linked publicly).

## Run it locally

```bash
npm install
cp .env.local.example .env.local
# Fill in your Upstash Redis credentials — grab them from console.upstash.com
npm run dev
```

## Why this is here

Sometimes you don't need agents and a back end. Sometimes the right product is a switch that says "in use." Most of my projects are slow burns. This one was an afternoon. It's still the one my neighbors actually use every day.
