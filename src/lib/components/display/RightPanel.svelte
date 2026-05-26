<script lang="ts">
    import type { DisplayPayload } from "$lib/types/display";

    interface Props {
        payload: DisplayPayload;
        hijriyahDate: string;
        weatherTemp: number | null;
        weatherCode: number | null;
        weatherLoading: boolean;
        currentJumbotron: number;
        isJumat: boolean;
        isJumatCardVisible?: boolean;
        mood?: "normal" | "adzan" | "iqamah" | "khusuk";
        moodPrayerKey?: string;
    }

    let {
        payload,
        hijriyahDate,
        weatherTemp,
        weatherCode,
        weatherLoading,
        currentJumbotron,
        isJumat,
        isJumatCardVisible = false,
        mood = "normal",
        moodPrayerKey = "",
    }: Props = $props();

    // Card SHOLAT JUM'AT: hari Jumat + sebelum 12.00 + belum adzan Jumat
    const showJumatCard = $derived(
        isJumatCardVisible &&
            payload.schedule.iqamah?.jumat?.enabled &&
            !(mood === "adzan" && moodPrayerKey === "dzuhur"),
    );

    function getWeatherIcon(code: number): string {
        if (code === 0) return "☀️";
        if (code <= 2) return "⛅";
        if (code <= 3) return "☁️";
        if (code <= 49) return "🌫️";
        if (code <= 59) return "🌦️";
        if (code <= 69) return "🌧️";
        if (code <= 79) return "🌨️";
        if (code <= 84) return "🌧️";
        if (code <= 99) return "⛈️";
        return "🌡️";
    }

    function getWeatherDesc(code: number): string {
        if (code === 0) return "Cerah";
        if (code <= 2) return "Berawan Sebagian";
        if (code <= 3) return "Mendung";
        if (code <= 49) return "Berkabut";
        if (code <= 59) return "Gerimis";
        if (code <= 69) return "Hujan";
        if (code <= 79) return "Hujan Es";
        if (code <= 84) return "Hujan Lebat";
        if (code <= 99) return "Badai Petir";
        return "Tidak Diketahui";
    }
</script>

<aside class="right-panel">
    <!-- TANGGAL HIJRIYAH -->
    <div class="info-card hijriyah-card">
        <div class="info-card-title">KALENDER HIJRIYAH</div>
        <div class="hijriyah-value">{hijriyahDate || "—"}</div>
    </div>

    <!-- CUACA LOKAL -->
    {#if payload.masjid.latitude && payload.masjid.longitude}
        <div class="info-card weather-card">
            <div class="info-card-title">CUACA LOKAL</div>
            {#if weatherLoading}
                <div class="weather-loading">Memuat...</div>
            {:else if weatherTemp !== null && weatherCode !== null}
                <div class="weather-body">
                    <div class="weather-icon">
                        {getWeatherIcon(weatherCode)}
                    </div>
                    <div class="weather-info">
                        <div class="weather-temp">{weatherTemp}°C</div>
                        <div class="weather-desc">
                            {getWeatherDesc(weatherCode)}
                        </div>
                    </div>
                </div>
                {#if payload.masjid.city}
                    <div class="weather-city">{payload.masjid.city}</div>
                {/if}
            {:else}
                <div class="weather-loading">Tidak tersedia</div>
            {/if}
        </div>
    {/if}

    <!-- COUNTDOWN HARI BESAR -->
    {#if payload.events.length > 0 && payload.events[0].countdownEnabled}
        {@const event = payload.events[0]}
        <div class="info-card event-card">
            <!-- <div class="info-card-title">🗓️ COUNTDOWN HARI BESAR</div> -->
            <div class="event-days">
                {Math.max(
                    0,
                    Math.ceil(
                        (new Date(event.eventDate).getTime() - Date.now()) /
                            86400000,
                    ),
                )}
            </div>
            <div class="event-label">
                Hari lagi menuju<br />
                <span style="color: var(--accent-secondary); font-weight: 600;"
                    >{event.title}</span
                >
            </div>
        </div>
    {/if}

    <!-- IMSAKIYAH -->
    <div class="info-card">
        <!-- <div class="info-card-title">IMSAKIYAH</div> -->
        <div class="imsakiyah-row">
            <div>
                <div class="info-card-sub">Imsak</div>
                <div class="info-card-value imsakiyah-time">
                    {payload.schedule.resolved?.imsak ?? "--:--"}
                </div>
            </div>
            <div class="imsakiyah-sep">—</div>
            <div>
                <div class="info-card-sub">Syuruq</div>
                <div class="info-card-value imsakiyah-time">
                    {payload.schedule.resolved?.sunrise ?? "--:--"}
                </div>
            </div>
        </div>
    </div>

    <!-- SHOLAT JUMAT -->
    {#if showJumatCard}
        <div class="info-card jumat-card">
            <div class="info-card-title">SHOLAT JUM'AT</div>
            <div class="jumat-body">
                <div>
                    <div class="info-card-sub">Dzuhur / Khutbah</div>
                    <div class="info-card-value imsakiyah-time">
                        {payload.schedule.resolved?.dzuhur ?? "--:--"}
                    </div>
                </div>
                <div class="imsakiyah-sep">→</div>
                <div>
                    <div class="info-card-sub">Iqamah</div>
                    <div class="info-card-value imsakiyah-time">
                        {payload.schedule.iqamah.jumat.time}
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- JUMBOTRON / PENGUMUMAN -->
    {#if payload.jumbotrons.length > 0}
        {@const jumbotron =
            payload.jumbotrons[currentJumbotron % payload.jumbotrons.length]}
        <div class="info-card jumbotron-card">
            <div class="info-card-title">📢 PENGUMUMAN</div>
            {#if jumbotron.title}
                <div class="jumbotron-title">{jumbotron.title}</div>
            {/if}
            {#if jumbotron.content}
                <div class="jumbotron-content">{jumbotron.content}</div>
            {/if}
        </div>
    {/if}
</aside>

<style>
    .right-panel {
        width: 20%;
        display: flex;
        flex-direction: column;
        padding: 1% 1.5% 0.3% 1%;
        border-left: 1px solid var(--border-accent);
        background: var(--bg-secondary);
        gap: 1.5%;
        justify-content: flex-start;
        align-self: stretch;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .info-card {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 3% 7%;
    }

    .info-card-title {
        font-size: clamp(11px, 1.3vw, 36px);
        color: var(--accent-muted);
        letter-spacing: 0.12em;
        margin-bottom: 4%;
    }

    .info-card-value {
        font-size: clamp(18px, 2.2vw, 36px);
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.3;
    }

    .info-card-sub {
        font-size: clamp(12px, 1.4vw, 36px);
        color: var(--text-muted);
        margin-top: 2%;
    }

    .hijriyah-card {
        text-align: center;
    }

    .hijriyah-value {
        font-size: clamp(12px, 1.5vw, 32px);
        font-weight: 600;
        color: var(--accent-secondary);
        margin-top: 4%;
        line-height: 1.4;
    }

    .weather-loading {
        font-size: clamp(10px, 1.1vw, 15px);
        color: var(--text-muted);
        margin-top: 4%;
    }

    .weather-body {
        display: flex;
        align-items: center;
        gap: 8%;
        margin-top: 4%;
    }

    .weather-icon {
        font-size: clamp(24px, 3.2vw, 48px);
        line-height: 1;
    }

    .weather-info {
        display: flex;
        flex-direction: column;
        gap: 2%;
    }

    .weather-temp {
        font-size: clamp(20px, 2.6vw, 38px);
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.1;
    }

    .weather-desc {
        font-size: clamp(11px, 1.2vw, 18px);
        color: var(--text-muted);
    }

    .weather-city {
        font-size: clamp(10px, 1.1vw, 64px);
        color: var(--accent-muted);
        margin-top: 3%;
        text-align: center;
    }

    .event-card {
        text-align: center;
    }

    .event-days {
        font-size: clamp(36px, 5vw, 72px);
        font-weight: 700;
        color: var(--accent-secondary);
    }

    .event-label {
        font-size: clamp(12px, 1.3vw, 28px);
        color: var(--text-secondary);
        margin-top: 2%;
        line-height: 1.4;
    }

    .imsakiyah-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4%;
    }

    .imsakiyah-time {
        font-size: clamp(20px, 2vw, 46px);
    }

    .imsakiyah-sep {
        color: var(--accent-muted);
        font-size: clamp(10px, 2vw, 26px);
    }

    .jumat-card {
        border-color: rgba(200, 168, 75, 0.3);
        background: rgba(200, 168, 75, 0.06);
    }

    .jumat-body {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4%;
    }

    .jumbotron-card {
        border-color: rgba(100, 200, 255, 0.2);
        background: rgba(100, 200, 255, 0.04);
        flex: 1;
        overflow: hidden;
    }

    .jumbotron-title {
        font-size: clamp(12px, 1.5vw, 38px);
        font-weight: 700;
        color: #7dd3fc;
        margin-top: 4%;
        line-height: 1.3;
    }

    .jumbotron-content {
        font-size: clamp(11px, 1.2vw, 32px);
        color: var(--text-secondary);
        margin-top: 3%;
        line-height: 1.5;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 5;
        line-clamp: 5;
        -webkit-box-orient: vertical;
    }

    @media (max-width: 900px) {
        .right-panel {
            display: none;
        }
    }
</style>
