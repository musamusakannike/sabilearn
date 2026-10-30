# SabiLearn Learner QA Report: Web Development Chapter 1

*Prepared with Fo · Made for Musa · Updated 30 Oct 2026*

SabiLearn walked the walk. I logged in with the sandbox account, completed all three lessons of Web Development Chapter 1 and passed its 10-question capstone with 100%, keeping notes the whole way. The learning loop is genuinely good and the content is right for a Nigerian absolute beginner. What holds the score down is not the teaching. It is progress accounting: the platform says a chapter is complete when its capstone is not, and it marks a lesson complete that was never opened. Those are trust bugs, and for a learning product trust in progress is the product.

## Overall: 7/10

### Strong classroom, faulty scoreboard

Content, quizzing and motivation earn an 8. Progress tracking bugs and one layout defect that touches every lesson screen pull it to a 7. All four are small fixes with outsized impact.

---

## 01 The course I picked and how far I got

I picked **Web Development for Beginners: HTML, CSS & JavaScript from Scratch** (the Web Development track, listed under your name as author, 90 lessons across 7 chapters, 1,650 XP total). It is the right test for three reasons: every new learner lands here first, its chapter shape (segments, embedded quizzes, capstone assessment) exercises the full learning loop, and as the largest track it stresses progress tracking hardest. I completed **Chapter 1: Welcome to the Web & Setting Up Your Workspace** end to end: the three lessons and the capstone, 10 of 10 correct, +200 XP. That is one full chapter, not the whole course.

### Run details

| Item | Detail |
|---|---|
| Account | androidtester@sabilearn.online, Free Learner Tier |
| Viewport | Desktop 1280×720 only |
| XP earned | 350 XP (150 lessons + 200 capstone) |
| Streak | 0 → 1 day |
| Not tested | Mobile viewport, payments, certificates, settings |

---

## 02 Bugs and errors

No critical bugs: nothing blocked completion. Four majors are progress and layout defects.

| # | Severity | Bug | Steps to reproduce | Expected vs actual |
|---|---|---|---|---|
| B1 | Major | Chapter shows Completed 100% while its capstone assessment is unfinished | Course page → complete all 3 lessons of Chapter 1, skip the capstone → read the chapter badge and expand details | **Expected:** In Progress ~75% until the capstone passes. **Actual:** badge reads Completed, 100%, and the capstone row shows no checkmark |
| B2 | Major | Unopened Chapter 2 lesson is marked complete | Finish Chapter 1 only → expand Chapter 2 details | **Expected:** no lesson checked. **Actual:** *Anatomy of an HTML Tag & Document Structure* shows a green check and the chapter reads In Progress 25%, though no Chapter 2 lesson was ever opened. Cause not verified from the UI |
| B3 | Major | Continue Chapter restarts the wrong lesson | Complete lesson 1 → course page → Continue Chapter | **Expected:** opens lesson 2, the first incomplete lesson. **Actual:** reopens lesson 1 from its first segment |
| B4 | Major | Sticky action bar covers lesson content and quiz controls | Open any lesson → scroll segments → reach a quiz | **Expected:** all text and buttons visible and clickable. **Actual:** the pinned bottom bar overlaps the last lines of text mid-sentence and partially hides the Check Answer button; scrolling is needed to reach controls. Observed on every lesson and quiz |
| B5 | Minor | Header XP and streak do not refresh after XP events | Complete a lesson (+50) or the capstone (+200) → watch the header | **Expected:** counter updates immediately (250 → 450). **Actual:** stays stale until a full page reload |
| B6 | Minor | First click on the capstone row does not navigate | Completed chapter → click the capstone row | **Expected:** assessment opens. **Actual:** route request fired but the page did not change; I had to open the assessment URL directly. Back to Course from the results screen showed the same behaviour once, recovering on the next render |
| B7 | Minor | Lesson-complete flow bounces to the course page | Finish a lesson → Continue on the completion screen | **Expected:** continue into the next lesson. **Actual:** returns to the course page; combined with B3 the resume target is wrong |

---

## 03 UX and design issues

Beyond the bugs, several patterns add friction or confusion. In rough order of impact:

- **The lesson player is forward-only.** Continue moves ahead; there is no way to step back to a previous segment or jump to a later one inside a lesson. Reviewing something from two segments ago means finishing and restarting.
- **Three buttons, three meanings, one label family.** Start Chapter, Continue Chapter and Retake Chapter behave differently, and Continue means both segment-advance and lesson-exit depending on the screen. Retake Chapter on a completed chapter implies redoing everything.
- **Completed means different things in different places.** The chapter badge ignores the capstone while the capstone itself has its own passed state. Learners cannot tell what done requires.
- **Notification drawer counts disagree.** The bell badge says 1 new, the drawer header says 1 unread of 4, and a welcome notification from Sep 30 is still sitting unread.
- **Small polish.** The results headline renders 100 % Score with a stray space, and in lesson 2 the term *Code Editors* is styled blue like a hyperlink. If it is a glossary term it should link somewhere; if not, it should not look like a link.
- **Accessibility, observed only.** Positive: quiz options are real buttons and icon-only controls carry aria-labels (Close lesson, Close notifications drawer). Concern: the locked rows use light grey text on the cream background, which reads low-contrast. I did not test keyboard navigation or screen readers, and mobile responsiveness is unverified.

---

## 04 Learning experience: the strongest part of the product

The teaching design is genuinely well done. Lessons are broken into short segments, each ending in a knowledge check, so a learner is never more than a screen or two from being tested. Feedback is instant and teaches in both directions: a correct answer gets a green tick plus a why, and a wrong answer gets a red mark, an explanation, and the correct answer highlighted. I deliberately answered one quiz wrong to confirm this path, and it worked exactly as it should.

Content quality is high for the audience. The client/server explanation uses concrete analogies, the VS Code setup walks through real steps, the HTML snippets are real and minimal, and the Live Server question in the capstone even explains the underlying mechanism (a local server on port 5500 with a websocket-triggered reload). The capstone itself is a proper mixed assessment of the whole chapter, and the post-assessment review shows every question with your answer and an explanation. Pacing suits absolute beginners; a confident learner may find tapping Continue through three or four segments per lesson tedious, since there is no skip-ahead or test-out option.

Progress tracking and motivation: XP (50 per lesson, 200 per capstone), a day streak, confetti on completion and a +XP banner all land well, and progress persisted correctly across navigation (every completion POST returned success). Certificates could not be verified in this run because the course was not finished, and that remains an open question for the full-course test.

---

## 05 Performance on a learner's connection

Everything was snappy on a good connection: pages, lessons, quizzes and API calls all responded fast, with every state-changing request returning success. Lessons are text, code and illustration with no video, which is the right call for weak or expensive mobile data; there was nothing in the lesson flow that would punish a learner on 2G beyond normal page loads. The one repeat offender is the pattern behind B6: route requests that fire and abort without completing, which wastes a request and can leave a learner staring at an unchanged page on a slow connection. A per-lesson offline or lightweight mode would make the product genuinely resilient on patchy networks, but nothing I observed currently breaks on a weak connection.

---

## 06 Top 10 improvements, ranked by impact against effort

1. **Fix Continue Chapter to open the first incomplete lesson.** High impact, low effort. Store the first incomplete topic per chapter and target it directly.
2. **Include the capstone in chapter progress and completion.** High impact, low effort. Percent should count the capstone; the Completed badge should require a passed assessment.
3. **Clear the false completed state on Chapter 2 lesson 1 and audit topic-complete writes.** High impact, low-to-medium effort. B2 suggests a write is landing for a topic the learner never opened; worth tracing whether chapter completion or unlock logic touches sibling lessons.
4. **Add bottom padding under lesson content.** High impact, low effort. One padding value on the lesson scroll area so the sticky bar never covers text or the Check Answer button.
5. **Send the learner to the next lesson after Lesson Complete.** High impact, low effort. Continue on the completion screen should route to the next topic, not the course page.
6. **Update XP and streak in the header immediately after XP events.** Medium impact, low effort. Emit an app-wide XP event the header subscribes to.
7. **Fix the aborted navigation on the capstone row and Back to Course.** Medium impact, low effort. Both fired route requests that did not complete; verify the click handlers against the route guards.
8. **Add a segment back-button and a lesson outline.** Medium impact, medium effort. Learners need to review and jump inside a lesson, not only move forward.
9. **Add a skip-to-quiz or test-out path per lesson.** Medium impact, medium effort. Keeps confident learners engaged instead of click-walking through familiar content.
10. **Close the loop after the capstone.** Low impact, low effort. The results screen offers Back to Course and Retake only; a Continue to Chapter 2 button plus the small polish items (notification counts, 100 % spacing, glossary link styling) finishes the experience.

---

## 07 What works well and should be kept

- **The segment-plus-quiz loop.** Short reading bursts with immediate checks is exactly how beginners retain material. Do not touch this.
- **Teaching feedback on wrong answers.** Explanations plus the highlighted correct answer turn a mistake into a lesson. Rarely seen done this well.
- **The capstone format.** A 10-question assessment with a full answer review gives the chapter a real finish line and a real reason to retain.
- **The motivation economy.** XP, streaks, confetti and the +XP banner are tuned to the right reward size for a study app.
- **Nigeria-first touches.** ₦3,000/month Pro pricing surfaced in the navigation and locally relevant article notifications (tech salaries in Nigeria) make the product feel built for the learner it claims.
- **Server-side progress persistence.** Every completion survived navigation and reload; state lives on the server, not the browser.
- **Text-first lessons.** No heavy media, fast loads, honest for the data plans the audience is on.

---

*Prepared with Fo · Wajo. Made for Musa.*