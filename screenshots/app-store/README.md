# App Store screenshots

`6.9-inch/`: 1320 × 2868, taken on the iPhone 18 Pro Max simulator. This is the one size Apple requires for iPhone; App Store Connect shrinks it for smaller iPhones by itself. Upload them in this order (Apple allows up to 10):

1. `01-welcome.png`: hey, i'm rilo
2. `02-your-number.png`: let's get some of it back
3. `03-your-plan.png`: here's your plan
4. `04-home.png`: Rilo, today vs goal, your apps with opens
5. `05-opening-app.png`: opening tiktok?
6. `06-why-open.png`: what are you opening tiktok for?
7. `07-progress.png`: level, week, where your time goes
8. `08-pick-rilo.png`: 23 Rilos to unlock
9. `09-talk.png`: talk to Rilo

The tester "demo" button is hidden in these (DEBUG `-nodemo`), and pick-rilo shows the real locks (`-gated`). To retake one: `SHOT_DEV_OVERRIDE=1 DEV=<pro max udid> shot.sh <out> -screen <name> -nodemo`.
