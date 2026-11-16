# Muhammad Tahir Hussain — Portfolio v7

Live: <https://muhammadtahirhussain-official.github.io/portfolio-v7/>

One WebGL canvas sits behind the page:

- a **liquid chrome form** (an icosphere displaced by noise, iridescent physical material) that travels, reshapes and
  turns spiky as you move through the sections and stirs faster when you scroll fast;
- a **3D ring of project cards**, built from the GitHub API on every visit, that turns as you scroll the pinned Work section
  (click a card to open the repo);
- the **portrait** drawn by a fluid shader that ripples under the cursor and bends with scroll speed.

Around it: smooth scrolling (Lenis), GSAP scroll animation, word-by-word manifesto reveal, velocity-reactive marquees,
a magnetic contact button and a blend-mode cursor.

## Projects update themselves

A new public repo becomes a new card (cached 10 minutes per visitor). The repo description is the card text,
the repo website adds a "Visit live" button, and the topic `portfolio-hide` leaves a repo out.

## Run locally

```bash
python -m http.server 4179
```

Without WebGL, or with reduced motion on, the page shows a plain project list and a static portrait.
