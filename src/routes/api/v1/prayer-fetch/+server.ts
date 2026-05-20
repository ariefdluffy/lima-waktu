import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent } from "$lib/server/auth/basic";

// MyQuran API docs:
// Search kota : GET https://api.myquran.com/v2/sholat/kota/cari/{keyword}
// Jadwal harian: GET https://api.myquran.com/v2/sholat/jadwal/{kota_id}/{tahun}/{bulan}/{hari}
// Jadwal bulanan: GET https://api.myquran.com/v2/sholat/jadwal/{kota_id}/{tahun}/{bulan}

type MyQuranJadwal = {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
};

export const GET: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { url } = event;
  const action = url.searchParams.get("action");

  // ----------------------------------------------------------------
  // action=search  →  cari kota berdasarkan keyword
  // ----------------------------------------------------------------
  if (action === "search") {
    const keyword = url.searchParams.get("keyword")?.trim();
    if (!keyword || keyword.length < 2) {
      return json(
        { ok: false, message: "Keyword minimal 2 karakter" },
        { status: 400 },
      );
    }

    const res = await fetch(
      `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(keyword)}`,
    );
    if (!res.ok) {
      return json(
        { ok: false, message: "Gagal mengambil data kota dari MyQuran" },
        { status: 502 },
      );
    }
    const data = await res.json();
    return json({ ok: true, data: data.data ?? [] });
  }

  // ----------------------------------------------------------------
  // action=schedule  →  jadwal satu hari
  // ----------------------------------------------------------------
  if (action === "schedule") {
    const kotaId = url.searchParams.get("kota_id")?.trim();
    const dateRaw = url.searchParams.get("date")?.trim(); // YYYY-MM-DD

    if (!kotaId) {
      return json(
        { ok: false, message: "Parameter kota_id wajib diisi" },
        { status: 400 },
      );
    }
    if (!dateRaw || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      return json(
        { ok: false, message: "Parameter date harus format YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const [year, month, day] = dateRaw.split("-");
    const res = await fetch(
      `https://api.myquran.com/v2/sholat/jadwal/${encodeURIComponent(kotaId)}/${year}/${month}/${day}`,
    );
    if (!res.ok) {
      return json(
        { ok: false, message: "Gagal mengambil jadwal dari MyQuran" },
        { status: 502 },
      );
    }
    const data = await res.json();
    const jadwal: MyQuranJadwal | undefined = data?.data?.jadwal;
    if (!jadwal) {
      return json(
        { ok: false, message: "Data jadwal tidak ditemukan" },
        { status: 404 },
      );
    }

    return json({
      ok: true,
      data: {
        imsakTime: jadwal.imsak,
        subuhTime: jadwal.subuh,
        sunriseTime: jadwal.terbit,
        dhuhaTime: jadwal.dhuha,
        dzuhurTime: jadwal.dzuhur,
        asharTime: jadwal.ashar,
        maghribTime: jadwal.maghrib,
        isyaTime: jadwal.isya,
      },
    });
  }

  // ----------------------------------------------------------------
  // action=bulk  →  jadwal satu bulan penuh
  // ----------------------------------------------------------------
  if (action === "bulk") {
    const kotaId = url.searchParams.get("kota_id")?.trim();
    const year = url.searchParams.get("year")?.trim();
    const month = url.searchParams.get("month")?.trim(); // 1-12

    if (!kotaId || !year || !month) {
      return json(
        {
          ok: false,
          message: "Parameter kota_id, year, dan month wajib diisi",
        },
        { status: 400 },
      );
    }

    const paddedMonth = month.padStart(2, "0");

    const res = await fetch(
      `https://api.myquran.com/v2/sholat/jadwal/${encodeURIComponent(kotaId)}/${year}/${paddedMonth}`,
    );
    if (!res.ok) {
      return json(
        { ok: false, message: "Gagal mengambil jadwal bulanan dari MyQuran" },
        { status: 502 },
      );
    }
    const data = await res.json();
    const jadwalList: MyQuranJadwal[] = data?.data?.jadwal ?? [];

    if (!jadwalList.length) {
      return json(
        { ok: false, message: "Data jadwal bulanan tidak ditemukan" },
        { status: 404 },
      );
    }

    // Normalise ke format yang dipakai form
    const schedules = jadwalList
      .map((j) => {
        // j.tanggal bisa berupa number (1) atau string ("Jumat, 01/05/2026")
        // Ekstrak angka hari saja
        let dayNum: number;
        if (typeof j.tanggal === "number") {
          dayNum = j.tanggal;
        } else {
          // Format: "Jumat, 01/05/2026" — ambil bagian DD dari DD/MM/YYYY
          const match = String(j.tanggal).match(/(\d{1,2})\/\d{2}\/\d{4}/);
          dayNum = match ? parseInt(match[1], 10) : NaN;
        }
        const dayStr = String(dayNum).padStart(2, "0");
        return {
          date: `${year}-${paddedMonth}-${dayStr}`,
          imsakTime: j.imsak,
          subuhTime: j.subuh,
          sunriseTime: j.terbit,
          dhuhaTime: j.dhuha,
          dzuhurTime: j.dzuhur,
          asharTime: j.ashar,
          maghribTime: j.maghrib,
          isyaTime: j.isya,
        };
      })
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.date));

    return json({ ok: true, data: schedules });
  }

  return json(
    {
      ok: false,
      message:
        "Parameter action tidak valid. Gunakan: search | schedule | bulk",
    },
    { status: 400 },
  );
};
