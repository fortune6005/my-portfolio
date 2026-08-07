import { useEffect, useRef, useState } from "react";
import sushiSticker from "../assets/image/ステッカー寿司.png";
import donutSticker from "../assets/image/ステッカードーナツ.png";
import ghostSticker from "../assets/image/ステッカーお化け.png";
import coffeeSticker from "../assets/image/ステッカーコーヒー.png";
import coverDefault from "../assets/image/表紙キャラクター青-transparent.png";
import coverFed from "../assets/image/表紙キャラクター青満腹-transparent.png";
import coverDislike from "../assets/image/表紙キャラクター青苦手-transparent.png";
import posterImage from "../assets/image/ドローイング展ポスター.png";
import drawingImage from "../assets/image/ドローイング作品.png";
import closingDog from "../assets/image/犬後ろ姿-transparent.png";
import loadingDog from "../assets/image/犬イラスト-transparent.png";
const sections = ["HOME", "STORY", "WORKS", "CONNECT"];

function SectionLinks({ current, className = "chapter-nav" }) {
  return (
    <nav className={className} aria-label="サイト内メニュー">
      {sections.map((section) => (
        <a key={section} className={section === current ? "is-current" : undefined} href={`#${section.toLowerCase()}`}>
          {section}
        </a>
      ))}
    </nav>
  );
}

function BookTabs({ current, closing = false }) {
  return (
    <nav className={`book-tabs${closing ? " closing-tabs" : ""}`} aria-label="ページを選ぶ">
      {sections.map((section) => (
        <a key={section} className={`book-tab${section === current ? " is-active" : ""}`} href={`#${section.toLowerCase()}`}>
          <span>{section}</span>
        </a>
      ))}
    </nav>
  );
}

function Marquee({ comingSoon = false }) {
  const copy = comingSoon
    ? "COMING SOON　　　COMING SOON　　　COMING SOON　　　COMING SOON　　　"
    : "FUKUNISHI KAIERI PORTFOLIO　　　FUKUNISHI KAIERI PORTFOLIO　　　";
  return (
    <div className={`marquee${comingSoon ? " marquee--reverse" : ""}`} aria-hidden="true">
      <div className="marquee__track"><span>{copy}</span><span>{copy}</span></div>
    </div>
  );
}

function MarkerTrail({ enabled }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    const points = [];
    const duration = 420;
    let frame;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const move = (event) => {
      if (!enabled || event.pointerType !== "mouse") return;
      const now = performance.now();
      const previous = points.at(-1);
      if (previous) {
        const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
        const steps = Math.min(12, Math.max(1, Math.ceil(distance / 4)));
        for (let step = 1; step <= steps; step += 1) {
          const progress = step / steps;
          points.push({ x: previous.x + (event.clientX - previous.x) * progress, y: previous.y + (event.clientY - previous.y) * progress, time: now });
        }
      } else points.push({ x: event.clientX, y: event.clientY, time: now });
      while (points.length > 180) points.shift();
    };
    const draw = (now) => {
      while (points[0] && now - points[0].time > duration) points.shift();
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.lineWidth = 17;
      context.lineCap = "round";
      context.lineJoin = "round";
      if (enabled && points.length > 1) {
        const last = points.at(-1);
        const stoppedAge = Math.min(1, (now - last.time) / duration);
        context.strokeStyle = `rgba(255, 99, 71, ${0.22 * (1 - stoppedAge)})`;
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < points.length - 1; index += 1) {
          const current = points[index];
          const next = points[index + 1];
          context.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
        }
        context.lineTo(last.x, last.y);
        context.stroke();
      }
      frame = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
    };
  }, [enabled]);
  return <canvas ref={canvasRef} className="marker-trail" aria-hidden="true" />;
}

const foodItems = [
  { id: "sushi", label: "お寿司を食べさせる", image: sushiSticker, alt: "お寿司のステッカー", reaction: "like" },
  { id: "donut", label: "ドーナツを食べさせる", image: donutSticker, alt: "ドーナツのステッカー", reaction: "like" },
  { id: "ghost", label: "お化けを近づける", image: ghostSticker, alt: "お化けのステッカー", reaction: "dislike" },
  { id: "coffee", label: "コーヒーを近づける", image: coffeeSticker, alt: "コーヒーのステッカー", reaction: "dislike" },
];

function Cover({ markerEnabled, setMarkerEnabled }) {
  const characterRef = useRef(null);
  const resetTimer = useRef();
  const drag = useRef({});
  const [reaction, setReaction] = useState("default");
  const [eaten, setEaten] = useState(null);

  const resetPosition = (element) => {
    Object.assign(element.style, { left: "", top: "", right: "", bottom: "" });
  };
  const reactTo = (item, element) => {
    if (eaten) return;
    setEaten(item.id);
    setReaction(item.reaction === "dislike" ? "dislike" : "fed");
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setEaten(null);
      setReaction("default");
      resetPosition(element);
    }, 2800);
  };
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const pointerDown = (event) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const parentRect = element.offsetParent.getBoundingClientRect();
    drag.current = { id: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top, moved: false };
    Object.assign(element.style, { left: `${rect.left - parentRect.left}px`, top: `${rect.top - parentRect.top}px`, right: "auto", bottom: "auto" });
    element.classList.add("is-dragging");
    element.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event) => {
    const element = event.currentTarget;
    if (drag.current.id !== event.pointerId || !element.hasPointerCapture(event.pointerId)) return;
    const parentRect = element.offsetParent.getBoundingClientRect();
    const left = Math.min(parentRect.width - element.offsetWidth, Math.max(0, event.clientX - parentRect.left - drag.current.x));
    const top = Math.min(parentRect.height - element.offsetHeight, Math.max(0, event.clientY - parentRect.top - drag.current.y));
    Object.assign(element.style, { left: `${left}px`, top: `${top}px` });
    drag.current.moved = true;
  };
  const pointerUp = (event, item) => {
    const element = event.currentTarget;
    if (drag.current.id !== event.pointerId) return;
    element.releasePointerCapture(event.pointerId);
    element.classList.remove("is-dragging");
    const foodRect = element.getBoundingClientRect();
    const characterRect = characterRef.current.getBoundingClientRect();
    const x = foodRect.left + foodRect.width / 2;
    const y = foodRect.top + foodRect.height / 2;
    if (x >= characterRect.left && x <= characterRect.right && y >= characterRect.top && y <= characterRect.bottom) reactTo(item, element);
    else resetPosition(element);
    drag.current.id = undefined;
  };

  const character = reaction === "fed" ? coverFed : reaction === "dislike" ? coverDislike : coverDefault;
  const alt = reaction === "fed" ? "食べて満足し、お腹をさすっているキャラクター" : reaction === "dislike" ? "苦手なものを嫌そうに避けているキャラクター" : "食べ物を待っているキャラクター";

  return (
    <section className="chapter chapter--home" id="home">
      <div className="book-panel" aria-label="ポートフォリオの本">
        <div className="book-panel__edge" aria-hidden="true" />
        <div className="book-page is-active">
          <img ref={characterRef} className={`book-page__character${reaction === "fed" ? " is-fed" : reaction === "dislike" ? " is-disliked" : ""}`} src={character} alt={alt} />
          {foodItems.map((item) => (
            <button key={item.id} className={`food-token food-token--${item.id}${eaten === item.id ? " is-eaten" : ""}`} type="button" aria-label={item.label}
              onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={(event) => pointerUp(event, item)}
              onPointerCancel={(event) => { event.currentTarget.classList.remove("is-dragging"); resetPosition(event.currentTarget); drag.current = {}; }}
              onClick={(event) => { if (!drag.current.moved) reactTo(item, event.currentTarget); drag.current.moved = false; }}>
              <img src={item.image} alt={item.alt} />
            </button>
          ))}
        </div>
        <BookTabs current="HOME" />
      </div>
      <div className="intro-panel">
        <div className="intro-copy is-active">
          <h2 className="intro-copy__name">Fukunishi Kairi<br /><span>portfolio</span></h2>
          <p className="intro-copy__tagline">子供心を忘れない高専生</p>
        </div>
        <p className="intro-panel__updated">最終更新日　2026.08.07</p>
      </div>
      <button className="marker-toggle marker-toggle--floating" type="button" aria-pressed={markerEnabled} aria-label={`マーカーの軌跡を${markerEnabled ? "オフ" : "オン"}にする`} onClick={() => setMarkerEnabled((value) => !value)}>
        <span className="marker-toggle__text">マーカー {markerEnabled ? "ON" : "OFF"}</span>
      </button>
    </section>
  );
}

function FlipBook({ children }) {
  const sheets = Array.isArray(children) ? children : [children];
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState("idle");
  const nextRef = useRef(active);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const go = (next) => {
    if (phase !== "idle" || !sheets[next]) return;
    nextRef.current = next;
    setPhase("out");
    timers.current.push(window.setTimeout(() => {
      setActive(nextRef.current);
      setPhase("in");
      timers.current.push(window.setTimeout(() => setPhase("idle"), 300));
    }, 240));
  };
  return (
    <div className="flipbook" data-flipbook>
      {sheets.map((sheet, index) => {
        const className = `flip-sheet${index === active ? " is-active" : ""}${index === active && phase === "out" ? " is-fading-out" : ""}${index === active && phase === "in" ? " is-fading-in" : ""}`;
        return <article key={index} className={`${className}${sheet.props.className ? ` ${sheet.props.className}` : ""}`}>{sheet.props.children({ go, active })}</article>;
      })}
    </div>
  );
}

const Corner = ({ direction, onClick, label }) => <button className={`page-corner page-corner--${direction}`} type="button" onClick={onClick} aria-label={label}><span>{direction === "next" ? "次のページ" : "前のページ"}</span></button>;

function Story() {
  return (
    <section className="chapter chapter--spread" id="story">
      <SectionLinks current="STORY" />
      <FlipBook>
        <template>{({ go }) => <><div className="spread-page spread-page--left"><p className="chapter-kicker">02 / MY STORY</p><h2>STORY</h2><p className="spread-page__caption">今まで歩みをご覧ください。</p></div><div className="spread-page spread-page--right story-contents"><p className="story-contents__label">TABLE OF CONTENTS</p><div className="story-contents__list"><button type="button" onClick={() => go(1)}><span>01</span> 誕生</button><button type="button" onClick={() => go(2)}><span>02</span> 高校受験</button><button type="button" disabled><span>03</span> これからのページ <small>COMING SOON</small></button><button type="button" disabled><span>04</span> これからのページ <small>COMING SOON</small></button></div></div><Corner direction="next" onClick={() => go(1)} label="成り立ちの次の内容を表示する" /></>}</template>
        <template>{({ go }) => <><div className="story-detail story-detail--media"><p className="chapter-kicker">02 / MY STORY — 02</p><p className="story-detail__date">2008/6/25</p><div className="story-detail__visual" aria-label="写真を追加する場所"><span>PHOTO</span></div><p className="story-detail__tags">#誕生</p></div><div className="story-detail story-detail--text story-diary"><p className="story-diary__label">DIARY / 01</p><h3>生誕する</h3><p>2兄弟の長女として、香川県に生まれる。泣くことも少なく。<br />おじいちゃんと共に育ち、おじいちゃん子になる。</p></div><Corner direction="prev" onClick={() => go(0)} label="成り立ちの前の内容へ戻る" /><Corner direction="next" onClick={() => go(2)} label="成り立ちの次の内容をめくる" /></>}</template>
        <template>{({ go }) => <><div className="story-detail story-detail--media"><p className="chapter-kicker">02 / MY STORY — 03</p><p className="story-detail__date">15歳 / 高校受験</p><div className="story-detail__visual story-detail__visual--second" aria-label="写真を追加する場所"><span>PHOTO</span></div><p className="story-detail__tags">#高校受験　#高専　#寮生活</p></div><div className="story-detail story-detail--text story-diary"><p className="story-diary__label">DIARY / 02</p><h3>高校受験</h3><p>神山まるごと高専を知り、くることを決意。15歳で親から離れ寮生活を選ぶ。不安なこともありつつ、同じ決断をした仲間と今までと違う生活に。</p></div><Corner direction="prev" onClick={() => go(1)} label="成り立ちの前の内容へ戻る" /></>}</template>
      </FlipBook>
    </section>
  );
}

function Works() {
  return (
    <section className="chapter chapter--spread chapter--works" id="works">
      <SectionLinks current="WORKS" />
      <FlipBook>
        <template>{({ go }) => <><div className="spread-page spread-page--left"><p className="chapter-kicker">03 / SELECTED WORKS</p><h2>works</h2><p className="spread-page__caption">今まで作った作品についてご覧ください。</p></div><div className="spread-page spread-page--right story-contents works-contents"><p className="story-contents__label">WORKS INDEX</p><div className="story-contents__list"><button type="button" onClick={() => go(1)}><span>01</span> 2人でのポスター制作</button><button type="button" onClick={() => go(2)}><span>02</span> 自身のドローイング</button><button type="button" disabled><span>03</span> Next Project <small>COMING SOON</small></button><button type="button" disabled><span>04</span> Next Project <small>COMING SOON</small></button></div></div><Corner direction="next" onClick={() => go(1)} label="次の作品をめくる" /></>}</template>
        <template className="work-sheet work-sheet--poster">{({ go }) => <><div className="work-detail work-detail--media"><p className="chapter-kicker">03 / SELECTED WORKS — 01</p><p className="work-detail__index">2025/冬</p><figure className="work-sheet__image"><img src={posterImage} alt="ドローイング展のポスター" /></figure><p className="work-detail__tags">#グラフィックデザイン　#共同　#ポスター</p></div><div className="work-detail work-detail--text"><p className="work-detail__label">WORK NOTE / 01</p><h3>2人でのポスター制作</h3><p>２人で行った作品の入り口の紹介になるポスター。デザインの趣味が違う中で一つのお題に対して、絶対に伝えたい思いと、自身たちの個性を結合。作品への繋がり、また、見かける人の興味の割合を考え、モノトーンでシンプルなのに目を引くデザインに。</p></div><Corner direction="prev" onClick={() => go(0)} label="Worksの前の内容へ戻る" /><Corner direction="next" onClick={() => go(2)} label="次の作品をめくる" /></>}</template>
        <template className="work-sheet work-sheet--drawing">{({ go }) => <><div className="work-detail work-detail--media"><p className="chapter-kicker">03 / SELECTED WORKS — 02</p><p className="work-detail__index">2025/冬</p><figure className="work-sheet__image work-sheet__image--drawing"><img src={drawingImage} alt="自然と人の姿を重ねたドローイング作品" /></figure><p className="work-detail__tags">#ドローイング　#アート</p></div><div className="work-detail work-detail--text"><p className="work-detail__label">WORK NOTE / 02</p><h3>自身のドローイング</h3><p>ドローイングとは作品の原点であり、その人の思考や感情を映し出す。私は自然と人を重ねて何かを考えることが多い。見る角度を変えることで日常の自然に隠れている人の影が見えるのを、顔の形がついたカーテン、背景と透過した人で表現した作品。</p></div><Corner direction="prev" onClick={() => go(1)} label="Worksの前の内容へ戻る" /></>}</template>
      </FlipBook>
    </section>
  );
}

function Contact() {
  const kana = useRef(null);
  const message = useRef(null);
  const combined = useRef(null);
  const form = useRef(null);
  const submitted = useRef(false);
  const [status, setStatus] = useState("");
  const submit = () => {
    combined.current.value = `ふりがな：${kana.current.value}\n\n要件：\n${message.current.value}`;
    submitted.current = true;
    setStatus("送信しています…");
  };
  const responseLoaded = () => {
    if (!submitted.current) return;
    setStatus("送信しました。ありがとうございます！");
    form.current.reset();
    submitted.current = false;
  };
  return (
    <section className="chapter chapter--connect" id="connect">
      <div className="connect-copy">
        <SectionLinks current="CONNECT" className="connect-mobile-tabs" />
        <div className="contact-form-embed"><div className="contact-form-embed__heading"><div><h3>お問合せ</h3></div></div>
          <form ref={form} className="contact-form" action="https://docs.google.com/forms/d/e/1FAIpQLScOcsVEeaOzsQSSX911flsh9IUj591ZSUVKOrDMCXDcEiVzyA/formResponse" method="post" target="contact-response" onSubmit={submit}>
            <div className="contact-form__row"><label>名前 <span>*</span><input name="entry.1486817881" type="text" autoComplete="name" required placeholder="福西 かい里" /></label><label>ふりがな <span>*</span><input ref={kana} type="text" required placeholder="ふくにし かいり" /></label></div>
            <label>連絡先（Instagram または Gmail） <span>*</span><input name="entry.1113090130" type="text" required placeholder="@instagram / example@gmail.com" /></label>
            <label>要件 <span>*</span><textarea ref={message} required placeholder="お問い合わせ内容をご記入ください" /></label>
            <input ref={combined} name="entry.701852948" type="hidden" />
            <button className="contact-form__submit" type="submit">送信する <span aria-hidden="true">→</span></button><p className="contact-form__status" role="status" aria-live="polite">{status}</p>
          </form><iframe className="contact-response" name="contact-response" title="フォーム送信結果" onLoad={responseLoaded} />
        </div>
      </div>
      <div className="closing-book"><BookTabs current="CONNECT" closing /><div className="closing-book__inner"><img className="closing-book__character" src={closingDog} alt="後ろ姿の犬" /></div><a className="closing-book__back" href="#home">↑ はじめに戻る</a></div>
    </section>
  );
}

function Loader() {
  const [phase, setPhase] = useState("");
  const [dots, setDots] = useState(".");
  useEffect(() => {
    let count = 1;
    const interval = window.setInterval(() => { count = count % 3 + 1; setDots(".".repeat(count)); }, 430);
    const opening = window.setTimeout(() => { window.clearInterval(interval); setDots("..."); setPhase("is-opening"); }, 3300);
    const revealing = window.setTimeout(() => setPhase("is-opening is-revealing"), 4300);
    const finished = window.setTimeout(() => setPhase("is-opening is-revealing is-finished"), 5000);
    return () => { window.clearInterval(interval); [opening, revealing, finished].forEach(clearTimeout); };
  }, []);
  return (
    <div className={`loader ${phase}`} role="status" aria-live="polite" aria-label="読み込み中"><div className="loader__grain" aria-hidden="true" /><div className="books" aria-hidden="true"><div className="book book--left"><span className="book__pages" /><span className="book__cover" /></div><div className="book book--center"><span className="book__pages" /><span className="book__cover"><span className="book__border" /></span></div><div className="book book--right"><span className="book__pages" /><span className="book__cover" /></div></div><div className="loader__content"><svg className="loading-arc" viewBox="0 0 360 160" aria-hidden="true"><defs><path id="loading-path" d="M 54 122 Q 180 2 306 122" /></defs><text><textPath href="#loading-path" startOffset="50%" textAnchor="middle">loading<tspan className="loading-dots">{dots}</tspan></textPath></text></svg><div className="character-wrap"><img className="character" src={loadingDog} alt="" width="1254" height="1254" /></div></div><p className="loader__note">ページをひらいています</p></div>
  );
}

export default function App() {
  const [markerEnabled, setMarkerEnabled] = useState(true);
  useEffect(() => { document.body.classList.toggle("marker-off", !markerEnabled); }, [markerEnabled]);
  return (
    <><main className="portfolio" aria-label="福西かい里のポートフォリオ"><Cover markerEnabled={markerEnabled} setMarkerEnabled={setMarkerEnabled} /><Marquee /><Story /><Marquee comingSoon /><Works /><Marquee /><Contact /></main><MarkerTrail enabled={markerEnabled} /><Loader /></>
  );
}
