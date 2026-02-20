const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WeatherCodeInfo {
  label: string;
  icon: "sunny" | "partly-cloudy" | "cloudy" | "foggy" | "rainy" | "snowy" | "stormy";
}

const weatherCodeMap: Record<number, WeatherCodeInfo> = {
  0: { label: "Clear sky", icon: "sunny" },
  1: { label: "Mainly clear", icon: "sunny" },
  2: { label: "Partly cloudy", icon: "partly-cloudy" },
  3: { label: "Overcast", icon: "cloudy" },
  45: { label: "Foggy", icon: "foggy" },
  48: { label: "Rime fog", icon: "foggy" },
  51: { label: "Light drizzle", icon: "rainy" },
  53: { label: "Drizzle", icon: "rainy" },
  55: { label: "Dense drizzle", icon: "rainy" },
  61: { label: "Light rain", icon: "rainy" },
  63: { label: "Rain", icon: "rainy" },
  65: { label: "Heavy rain", icon: "rainy" },
  71: { label: "Light snow", icon: "snowy" },
  73: { label: "Snow", icon: "snowy" },
  75: { label: "Heavy snow", icon: "snowy" },
  80: { label: "Rain showers", icon: "rainy" },
  81: { label: "Moderate showers", icon: "rainy" },
  82: { label: "Heavy showers", icon: "stormy" },
  95: { label: "Thunderstorm", icon: "stormy" },
  96: { label: "Thunderstorm with hail", icon: "stormy" },
  99: { label: "Severe thunderstorm", icon: "stormy" },
};

function getWeatherInfo(code: number): WeatherCodeInfo {
  return weatherCodeMap[code] ?? { label: "Unknown", icon: "cloudy" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: "Weather API error", details: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const cw = data.current_weather;

    const info = getWeatherInfo(cw.weathercode);

    return new Response(
      JSON.stringify({
        temperature: cw.temperature,
        weathercode: cw.weathercode,
        windspeed: cw.windspeed,
        is_day: cw.is_day === 1,
        label: info.label,
        icon: info.icon,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
