"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import {
  Search,
  X,
  MapPin,
  RotateCcw,
} from "lucide-react";

type Location = {
  name: string;
  country: string;
  countryCode?: string;
  lat: number;
  lng: number;
  population?: number;
  scaleRank?: number;
  capital?: boolean;
  worldCity?: boolean;
  megaCity?: boolean;
  featureClass?: string;
  wikidataId?: string;
};

type AirQuality = {
  us_aqi?: number;
  pm2_5?: number;
  pm10?: number;
  ozone?: number;
  nitrogen_dioxide?: number;
  time?: string;
};

const EARTH_RADIUS = 2.35;

/* =========================================================
   COORDINATES
========================================================= */

function latLngToVector3(
  lat: number,
  lng: number,
  radius: number
) {
  const latitude =
    THREE.MathUtils.degToRad(lat);

  const longitude =
    THREE.MathUtils.degToRad(lng);

  const cosLat = Math.cos(latitude);

  const x =
    radius *
    cosLat *
    Math.sin(longitude);

  const y =
    radius *
    Math.sin(latitude);

  const z =
    radius *
    cosLat *
    Math.cos(longitude);

  return new THREE.Vector3(
    x,
    y,
    z
  );
}

/* =========================================================
   ANGLE
========================================================= */

function normalizeAngle(
  angle: number
) {
  return Math.atan2(
    Math.sin(angle),
    Math.cos(angle)
  );
}

/* =========================================================
   AQI INFO
========================================================= */

function getAqiInfo(
  aqi?: number
) {
  if (
    aqi === undefined ||
    aqi === null
  ) {
    return {
      label: "Unavailable",
      className:
        "text-white/50",
    };
  }

  if (aqi <= 50) {
    return {
      label: "Good",
      className:
        "text-emerald-400",
    };
  }

  if (aqi <= 100) {
    return {
      label: "Moderate",
      className:
        "text-yellow-400",
    };
  }

  if (aqi <= 150) {
    return {
      label:
        "Unhealthy for sensitive groups",
      className:
        "text-orange-400",
    };
  }

  if (aqi <= 200) {
    return {
      label: "Unhealthy",
      className:
        "text-red-400",
    };
  }

  if (aqi <= 300) {
    return {
      label: "Very unhealthy",
      className:
        "text-purple-400",
    };
  }

  return {
    label: "Hazardous",
    className:
      "text-red-500",
  };
}

/* =========================================================
   FORMAT UPDATED TIME
========================================================= */

function formatUpdatedTime(
  time?: string
) {
  if (!time) {
    return "";
  }

  const date = new Date(time);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

/* =========================================================
   CITY MARKER
========================================================= */

function LocationMarker({
  location,
  selected,
  onSelect,
}: {
  location: Location;
  selected: boolean;
  onSelect: (
    location: Location
  ) => void;
}) {
  const [hovered, setHovered] =
    useState(false);

  const position = useMemo(
    () =>
      latLngToVector3(
        location.lat,
        location.lng,
        EARTH_RADIUS + 0.045
      ),
    [
      location.lat,
      location.lng,
    ]
  );

  const pulseRef =
    useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!pulseRef.current) {
      return;
    }

    const pulse =
      1 +
      Math.sin(
        clock.elapsedTime * 2.5
      ) *
        0.12;

    pulseRef.current.scale.setScalar(
      selected || hovered
        ? pulse
        : 1
    );
  });

  const showLabel =
    selected || hovered;

  return (
    <group
      position={position}
    >
      {/* Invisible interaction area */}

      <mesh
        onPointerEnter={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerLeave={(event) => {
          event.stopPropagation();
          setHovered(false);
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(location);
        }}
      >
        <sphereGeometry
          args={[
            0.13,
            12,
            12,
          ]}
        />

        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Main city dot */}

      <mesh
        raycast={() => null}
      >
        <sphereGeometry
          args={[
            selected
              ? 0.042
              : 0.027,
            12,
            12,
          ]}
        />

        <meshBasicMaterial
          color={
            selected || hovered
              ? "#ffffff"
              : "#7dd3fc"
          }
        />
      </mesh>

      {/* Glow */}

      <mesh
        ref={pulseRef}
        raycast={() => null}
      >
        <sphereGeometry
          args={[
            selected || hovered
              ? 0.075
              : 0.05,
            12,
            12,
          ]}
        />

        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={
            selected || hovered
              ? 0.2
              : 0.08
          }
          depthWrite={false}
        />
      </mesh>

      {/* Ring */}

      {(selected || hovered) && (
        <mesh
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
          raycast={() => null}
        >
          <ringGeometry
            args={[
              0.07,
              0.085,
              32,
            ]}
          />

          <meshBasicMaterial
            color="#7dd3fc"
            transparent
            opacity={0.65}
            side={
              THREE.DoubleSide
            }
            depthWrite={false}
          />
        </mesh>
      )}

      {/* City label */}

      {showLabel && (
        <Html
          position={[
            0,
            0.11,
            0,
          ]}
          center
          distanceFactor={5}
          style={{
            pointerEvents:
              "none",
            whiteSpace:
              "nowrap",
          }}
        >
          <div
            className="
              rounded-full
              border border-white/10
              bg-black/70
              px-2.5 py-1
              text-[10px]
              font-medium
              tracking-wide
              text-white
              backdrop-blur-md
              shadow-lg
            "
          >
            {location.name}
          </div>
        </Html>
      )}
    </group>
  );
}

/* =========================================================
   EARTH
========================================================= */

function ParticleEarth({
  locations,
  selectedLocation,
  onSelect,
}: {
  locations: Location[];
  selectedLocation:
    | Location
    | null;
  onSelect: (
    location: Location
  ) => void;
}) {
  const earthGroupRef =
    useRef<THREE.Group>(null);

  const targetRotationY =
    useRef<number | null>(null);

  const draggingRef =
    useRef(false);

  const lastPointerX =
    useRef(0);

  const lastPointerY =
    useRef(0);

  const landMask =
    useLoader(
      THREE.TextureLoader,
      "/textures/earth-land-mask.png"
    );

  /* -----------------------------------------
     MOBILE RESPONSIVE SCALE
  ----------------------------------------- */

  const [isMobile, setIsMobile] =
    useState(false);

  useEffect(() => {
    const update = () => {
      setIsMobile(
        window.innerWidth < 640
      );
    };

    update();

    window.addEventListener(
      "resize",
      update
    );

    return () => {
      window.removeEventListener(
        "resize",
        update
      );
    };
  }, []);

  /* -----------------------------------------
     LAND PARTICLES
  ----------------------------------------- */

  const particles = useMemo(() => {
    const image =
      landMask.image as HTMLImageElement;

    const canvas =
      document.createElement(
        "canvas"
      );

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return [];
    }

    canvas.width =
      image.width;

    canvas.height =
      image.height;

    ctx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height
    );

    const pixels =
      ctx.getImageData(
        0,
        0,
        image.width,
        image.height
      ).data;

    const positions: number[] =
      [];

    const step = 3;

    for (
      let y = 0;
      y < image.height;
      y += step
    ) {
      for (
        let x = 0;
        x < image.width;
        x += step
      ) {
        const index =
          (y *
            image.width +
            x) *
          4;

        const value =
          pixels[index];

        if (value < 128) {
          continue;
        }

        const longitude =
          (x /
            image.width) *
            360 -
          180;

        const latitude =
          90 -
          (y /
            image.height) *
            180;

        const latRad =
          THREE.MathUtils.degToRad(
            latitude
          );

        const lonRad =
          THREE.MathUtils.degToRad(
            longitude
          );

        const radius =
          EARTH_RADIUS +
          0.015 +
          Math.random() *
            0.018;

        const px =
          radius *
          Math.cos(latRad) *
          Math.sin(lonRad);

        const py =
          radius *
          Math.sin(latRad);

        const pz =
          radius *
          Math.cos(latRad) *
          Math.cos(lonRad);

        positions.push(
          px,
          py,
          pz
        );
      }
    }

    return positions;
  }, [landMask]);

  /* -----------------------------------------
     SEARCH / CITY FOCUS
  ----------------------------------------- */

  useEffect(() => {
    if (
      !selectedLocation ||
      !earthGroupRef.current
    ) {
      return;
    }

    if (draggingRef.current) {
      return;
    }

    const desired =
      -THREE.MathUtils.degToRad(
        selectedLocation.lng
      );

    const current =
      earthGroupRef.current
        .rotation.y;

    const delta =
      normalizeAngle(
        desired - current
      );

    targetRotationY.current =
      current + delta;
  }, [selectedLocation]);

  /* -----------------------------------------
     MOUSE / TOUCH DRAG
  ----------------------------------------- */

  function handlePointerDown(
    event: any
  ) {
    event.stopPropagation();

    if (!earthGroupRef.current) {
      return;
    }

    draggingRef.current =
      true;

    targetRotationY.current =
      null;

    lastPointerX.current =
      event.clientX;

    lastPointerY.current =
      event.clientY;

    try {
      event.target.setPointerCapture(
        event.pointerId
      );
    } catch {
      // Ignore pointer capture errors.
    }
  }

  function handlePointerMove(
    event: any
  ) {
    if (
      !draggingRef.current ||
      !earthGroupRef.current
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      lastPointerX.current;

    const deltaY =
      event.clientY -
      lastPointerY.current;

    lastPointerX.current =
      event.clientX;

    lastPointerY.current =
      event.clientY;

    /* Horizontal drag = Y rotation */

    earthGroupRef.current.rotation.y +=
      deltaX * 0.006;

    /* Vertical drag = X tilt */

    earthGroupRef.current.rotation.x +=
      deltaY * 0.004;

    earthGroupRef.current.rotation.x =
      THREE.MathUtils.clamp(
        earthGroupRef.current
          .rotation.x,
        -0.55,
        0.55
      );
  }

  function handlePointerUp(
    event: any
  ) {
    event.stopPropagation();

    draggingRef.current =
      false;

    try {
      event.target.releasePointerCapture(
        event.pointerId
      );
    } catch {
      // Ignore pointer capture errors.
    }
  }

  function handlePointerCancel(
    event: any
  ) {
    event.stopPropagation();

    draggingRef.current =
      false;
  }

  /* -----------------------------------------
     ANIMATION
  ----------------------------------------- */

  useFrame((_, delta) => {
    if (!earthGroupRef.current) {
      return;
    }

    const group =
      earthGroupRef.current;

    if (draggingRef.current) {
      return;
    }

    /* Smooth search focus */

    if (
      targetRotationY.current !==
      null
    ) {
      const target =
        targetRotationY.current;

      const current =
        group.rotation.y;

      const diff =
        target - current;

      const smooth =
        1 -
        Math.pow(
          0.001,
          delta
        );

      group.rotation.y =
        THREE.MathUtils.lerp(
          current,
          target,
          smooth
        );

      if (
        Math.abs(diff) <
        0.001
      ) {
        group.rotation.y =
          target;

        targetRotationY.current =
          null;
      }

      return;
    }

    /* Slow automatic rotation */

    group.rotation.y +=
      delta * 0.018;
  });

  /* -----------------------------------------
     GEOMETRY
  ----------------------------------------- */

  const geometry = useMemo(() => {
    const geo =
      new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        particles,
        3
      )
    );

    return geo;
  }, [particles]);

  return (
    <group
  ref={earthGroupRef}
  position={[
    0,
    isMobile ? 0.65 : 0,
    0,
  ]}
  scale={
    isMobile
      ? 0.62
      : 1
  }
>
      {/* Invisible interaction sphere */}

      <mesh
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
      >
        <sphereGeometry
          args={[
            EARTH_RADIUS + 0.06,
            64,
            64,
          ]}
        />

        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* LAND PARTICLES */}

      <points
        geometry={geometry}
      >
        <pointsMaterial
          color="#8bd8ff"
          size={0.017}
          sizeAttenuation
          transparent
          opacity={0.82}
          depthWrite={false}
        />
      </points>

      {/* CITY MARKERS */}

      {locations.map(
        (location) => (
          <LocationMarker
            key={`${location.name}-${location.lat}-${location.lng}`}
            location={location}
            selected={
              selectedLocation?.name ===
                location.name &&
              selectedLocation?.country ===
                location.country
            }
            onSelect={onSelect}
          />
        )
      )}
    </group>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Home() {
  const [
    allCities,
    setAllCities,
  ] = useState<Location[]>(
    []
  );

  const [
    selectedLocation,
    setSelectedLocation,
  ] =
    useState<Location | null>(
      null
    );

  const [
    aqiGuideOpen,
    setAqiGuideOpen,
  ] = useState(false);

  const [
    airQuality,
    setAirQuality,
  ] =
    useState<AirQuality | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [aqiError, setAqiError] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  /* -----------------------------------------
     AQI
  ----------------------------------------- */

  const loadAirQuality =
    useCallback(
      async (
        location: Location
      ) => {
        setSelectedLocation(
          location
        );

        setLoading(true);
        setAirQuality(null);
        setAqiError(false);

        try {
          const url =
            `https://air-quality-api.open-meteo.com/v1/air-quality` +
            `?latitude=${location.lat}` +
            `&longitude=${location.lng}` +
            `&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide` +
            `&timezone=auto`;

          const response =
            await fetch(url);

          if (!response.ok) {
            throw new Error(
              "AQI request failed"
            );
          }

          const data =
            await response.json();

          if (!data.current) {
            throw new Error(
              "AQI data unavailable"
            );
          }

          setAirQuality(
            data.current
          );
        } catch (error) {
          console.error(
            "AQI error:",
            error
          );

          setAirQuality(null);
          setAqiError(true);
        } finally {
          setLoading(false);
        }
      },
      []
    );

  /* -----------------------------------------
     LOAD NATURAL EARTH CITY DATA
  ----------------------------------------- */

  useEffect(() => {
    fetch("/data/cities.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Failed to load city data"
          );
        }

        return response.json();
      })
      .then(
        (data: Location[]) => {
          setAllCities(data);

          /* Initial city = Dhaka */

          const dhaka =
            data.find(
              (city) =>
                city.name.toLowerCase() ===
                  "dhaka" &&
                city.country.toLowerCase() ===
                  "bangladesh"
            );

          if (dhaka) {
            setSelectedLocation(
              dhaka
            );

            loadAirQuality(
              dhaka
            );
          }
        }
      )
      .catch((error) => {
        console.error(
          "City data error:",
          error
        );
      });
  }, [
    loadAirQuality,
  ]);

  /* -----------------------------------------
     AUTO REFRESH AQI
     Every 15 minutes
  ----------------------------------------- */

  useEffect(() => {
    if (!selectedLocation) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          loadAirQuality(
            selectedLocation
          );
        },
        15 * 60 * 1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    selectedLocation,
    loadAirQuality,
  ]);

  /* -----------------------------------------
     DISPLAYED CITIES
  ----------------------------------------- */

  const majorCities =
    useMemo(() => {
      const filtered =
        allCities.filter(
          (city) =>
            city.capital ||
            city.megaCity ||
            city.worldCity ||
            (city.scaleRank !==
              undefined &&
              city.scaleRank <=
                6) ||
            (city.population !==
              undefined &&
              city.population >=
                500000)
        );

      return filtered.slice(
        0,
        250
      );
    }, [allCities]);

  /* -----------------------------------------
     ADD SELECTED SEARCH CITY
     TO GLOBE
  ----------------------------------------- */

  const displayedCities =
    useMemo(() => {
      const map =
        new Map<
          string,
          Location
        >();

      for (const city of majorCities) {
        const key =
          `${city.name}-${city.country}-${city.lat}-${city.lng}`;

        map.set(
          key,
          city
        );
      }

      if (selectedLocation) {
        const key =
          `${selectedLocation.name}-${selectedLocation.country}-${selectedLocation.lat}-${selectedLocation.lng}`;

        map.set(
          key,
          selectedLocation
        );
      }

      return Array.from(
        map.values()
      );
    }, [
      majorCities,
      selectedLocation,
    ]);

  /* -----------------------------------------
     SEARCH RESULTS
  ----------------------------------------- */

  const searchResults =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return [];
      }

      return allCities
        .filter((city) => {
          const name =
            city.name.toLowerCase();

          const country =
            city.country.toLowerCase();

          return (
            name.includes(query) ||
            country.includes(query)
          );
        })
        .sort((a, b) => {
          const aExact =
            a.name.toLowerCase() ===
            query;

          const bExact =
            b.name.toLowerCase() ===
            query;

          if (
            aExact &&
            !bExact
          ) {
            return -1;
          }

          if (
            !aExact &&
            bExact
          ) {
            return 1;
          }

          return (
            (b.population ??
              0) -
            (a.population ??
              0)
          );
        })
        .slice(0, 8);
    }, [
      allCities,
      searchQuery,
    ]);

  /* -----------------------------------------
     SEARCH SELECT
  ----------------------------------------- */

  function handleSearchSelect(
    location: Location
  ) {
    loadAirQuality(
      location
    );

    setSearchQuery("");
    setSearchOpen(false);
  }

  /* -----------------------------------------
     ESCAPE CLOSES SEARCH
  ----------------------------------------- */

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  const aqiInfo =
    getAqiInfo(
      airQuality?.us_aqi
    );

  /* -----------------------------------------
     MAIN UI
  ----------------------------------------- */

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02060b] text-white sm:min-h-screen">

      {/* =====================================
          BACKGROUND
      ===================================== */}

      <div className="absolute inset-0">
        <Canvas
          camera={{
            position: [
              0,
              0,
              7.2,
            ],
            fov: 42,
          }}
          dpr={[
            1,
            1.5,
          ]}
        >
          <ambientLight
            intensity={0.35}
          />

          <Stars
            radius={80}
            depth={50}
            count={1200}
            factor={3}
            saturation={0}
            fade
            speed={0.4}
          />

          <ParticleEarth
            locations={
              displayedCities
            }
            selectedLocation={
              selectedLocation
            }
            onSelect={
              loadAirQuality
            }
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            autoRotate={false}
          />
        </Canvas>
      </div>

      {/* =====================================
          TOP GRADIENT
      ===================================== */}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />






      {/* HERO TEXT */}
<div
  className="
    pointer-events-none
    absolute
    left-1/2
    top-[13%]
    z-10
    hidden
    w-[90%]
    -translate-x-1/2
    text-center

    sm:block
    sm:left-[7%]
    sm:top-1/2
    sm:w-[300px]
    sm:-translate-y-1/2
    sm:translate-x-0
    sm:text-left

    lg:left-[9%]
    lg:w-[350px]
  "
>
  <div className="mb-3 flex items-center justify-center gap-2 sm:justify-start">
    <span className="h-px w-7 bg-cyan-300/30" />

    <span className="text-[8px] font-medium tracking-[0.4em] text-cyan-300/55 sm:text-[9px]">
      GLOBAL AIR INTELLIGENCE
    </span>
  </div>

  <h2 className="text-[22px] font-extralight leading-[1.15] tracking-[0.08em] text-white/80 sm:text-3xl lg:text-[38px]">
    AIR QUALITY
  </h2>

  <p className="mt-4 max-w-[300px] text-[9px] leading-relaxed tracking-[0.08em] text-white/25 sm:text-[10px]">
    Explore real-time air quality across
    cities around the world.
  </p>

  <div className="mt-5 flex items-center justify-center gap-2 sm:justify-start">
    <span className="h-1 w-1 rounded-full bg-cyan-300/60" />

    <span className="text-[7px] tracking-[0.3em] text-white/20 sm:text-[8px]">
      LIVE DATA • GLOBAL COVERAGE
    </span>
  </div>

  <p className="mt-5 text-[9px] tracking-[0.12em] text-white/25">
    Developed By{" "}
    <span className="text-white/45">
      Md. Arfan Ahmed
    </span>
  </p>
</div>


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-7">

        <div>
          <div className="text-[15px] font-semibold tracking-[0.35em] text-white">
            GLOBAIR
          </div>

          <div className="mt-1 text-[9px] tracking-[0.3em] text-white/35">
            GLOBAL AIR QUALITY
          </div>
        </div>

        {/* SEARCH */}

        <div className="relative">

          <button
            onClick={() => {
              setSearchOpen(
                (value) =>
                  !value
              );

              if (
                searchOpen
              ) {
                setSearchQuery(
                  ""
                );
              }
            }}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-white/10
              bg-white/[0.04]
              text-white/70
              backdrop-blur-xl
              transition
              hover:border-white/20
              hover:bg-white/[0.08]
              hover:text-white
            "
            aria-label="Search city"
          >
            {searchOpen ? (
              <X size={17} />
            ) : (
              <Search
                size={17}
              />
            )}
          </button>

          {searchOpen && (
            <div
              className="
                absolute
                right-0
                top-12
                w-[calc(100vw-2.5rem)]
                max-w-sm
              "
            >
              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#071018]/90
                  shadow-2xl
                  backdrop-blur-2xl
                "
              >

                {/* Search input */}

                <div className="flex items-center gap-3 border-b border-white/10 px-4">

                  <Search
                    size={16}
                    className="shrink-0 text-white/35"
                  />

                  <input
                    autoFocus
                    value={
                      searchQuery
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchQuery(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Search city or country..."
                    className="
                      h-12
                      w-full
                      bg-transparent
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-white/30
                    "
                  />

                  {searchQuery && (
                    <button
                      onClick={() =>
                        setSearchQuery(
                          ""
                        )
                      }
                      className="text-white/30 hover:text-white"
                    >
                      <X
                        size={15}
                      />
                    </button>
                  )}
                </div>

                {/* Results */}

                {searchQuery.trim() && (
                  <div className="max-h-80 overflow-y-auto py-1">

                    {searchResults.length >
                    0 ? (
                      searchResults.map(
                        (city) => (
                          <button
                            key={`${city.name}-${city.country}-${city.lat}-${city.lng}`}
                            onClick={() =>
                              handleSearchSelect(
                                city
                              )
                            }
                            className="
                              flex
                              w-full
                              items-center
                              gap-3
                              px-4
                              py-3
                              text-left
                              transition
                              hover:bg-white/[0.06]
                            "
                          >

                            <div
                              className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-cyan-400/10
                                text-cyan-300
                              "
                            >
                              <MapPin
                                size={
                                  14
                                }
                              />
                            </div>

                            <div className="min-w-0">

                              <div className="truncate text-sm text-white">
                                {
                                  city.name
                                }
                              </div>

                              <div className="truncate text-[11px] text-white/35">
                                {
                                  city.country
                                }
                              </div>

                            </div>

                          </button>
                        )
                      )
                    ) : (
                      <div className="px-4 py-5 text-center text-xs text-white/35">
                        No city found
                      </div>
                    )}

                  </div>
                )}

                {!searchQuery.trim() && (
                  <div className="px-4 py-4 text-[11px] leading-relaxed text-white/30">
                    Search from the Natural Earth city database.
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </header>

      {/* =====================================
          SELECTED LOCATION
      ===================================== */}

      {selectedLocation && (
        <section
          className="
            absolute
    bottom-16
    left-5
    right-5
    z-10
    sm:bottom-8
    sm:left-8
    sm:right-auto
    sm:w-[390px]
          "
        >
          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-black/40
              p-4
              shadow-2xl
              backdrop-blur-xl
              sm:p-5
            "
          >

            {/* LOCATION HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="flex items-center gap-2">

                  <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />

                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Selected location
                  </span>

                </div>

                <h1 className="mt-2 text-xl font-medium tracking-tight sm:text-2xl">
                  {
                    selectedLocation.name
                  }
                </h1>

                <p className="mt-0.5 text-xs text-white/35">
                  {
                    selectedLocation.country
                  }
                </p>

              </div>

              {/* AQI VALUE */}

              <div className="text-right">

                {loading ? (
                  <div className="flex items-center gap-2 text-xs text-white/35">

                    <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-cyan-300" />

                    Loading...

                  </div>
                ) : aqiError ? (
                  <div className="text-right">

                    <div className="text-[11px] text-red-400/80">
                      Unable to load AQI
                    </div>

                    <button
                      onClick={() =>
                        loadAirQuality(
                          selectedLocation
                        )
                      }
                      className="
                        mt-1
                        inline-flex
                        items-center
                        gap-1
                        text-[9px]
                        text-white/40
                        transition
                        hover:text-cyan-300
                      "
                    >
                      <RotateCcw
                        size={10}
                      />

                      Retry
                    </button>

                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-end gap-1.5">

                      <div className="text-3xl font-light tracking-tight">
                        {
                          airQuality?.us_aqi ??
                          "--"
                        }
                      </div>

                      <span className="text-[9px] uppercase tracking-wider text-white/30">
                        US AQI
                      </span>

                    </div>

                    <div
                      className={`mt-0.5 text-[10px] ${aqiInfo.className}`}
                    >
                      {
                        aqiInfo.label
                      }
                    </div>
                  </>
                )}

              </div>

            </div>

            {/* DATA SOURCE */}

            <div
              className="
                mt-3
                flex
                items-center
                justify-between
                rounded-lg
                border
                border-white/[0.06]
                bg-white/[0.025]
                px-3
                py-2
              "
            >

              <span className="text-[9px] text-white/30">
                AIR QUALITY DATA
              </span>

              <span className="text-[9px] text-white/45">
                Open-Meteo · Model-based
              </span>

            </div>

            {/* LAST UPDATED */}

            {airQuality?.time &&
              !loading && (
                <div className="mt-2 flex items-center justify-end">

                  <span className="text-[8px] text-white/25">
                    Updated{" "}
                    {formatUpdatedTime(
                      airQuality.time
                    )}
                  </span>

                </div>
              )}

            {/* POLLUTANTS */}

            <div className="mt-3 grid grid-cols-4 gap-2">

              {/* PM2.5 */}

              <div className="rounded-xl bg-white/[0.035] p-2.5">

                <div className="text-[9px] uppercase tracking-wider text-white/25">
                  PM2.5
                </div>

                <div className="mt-1 text-sm text-white/80">
                  {airQuality?.pm2_5 !==
                  undefined
                    ? airQuality.pm2_5.toFixed(
                        1
                      )
                    : "--"}
                </div>

                <div className="text-[8px] text-white/25">
                  μg/m³
                </div>

              </div>

              {/* PM10 */}

              <div className="rounded-xl bg-white/[0.035] p-2.5">

                <div className="text-[9px] uppercase tracking-wider text-white/25">
                  PM10
                </div>

                <div className="mt-1 text-sm text-white/80">
                  {airQuality?.pm10 !==
                  undefined
                    ? airQuality.pm10.toFixed(
                        1
                      )
                    : "--"}
                </div>

                <div className="text-[8px] text-white/25">
                  μg/m³
                </div>

              </div>

              {/* O3 */}

              <div className="rounded-xl bg-white/[0.035] p-2.5">

                <div className="text-[9px] uppercase tracking-wider text-white/25">
                  O₃
                </div>

                <div className="mt-1 text-sm text-white/80">
                  {airQuality?.ozone !==
                  undefined
                    ? airQuality.ozone.toFixed(
                        1
                      )
                    : "--"}
                </div>

                <div className="text-[8px] text-white/25">
                  μg/m³
                </div>

              </div>

              {/* NO2 */}

              <div className="rounded-xl bg-white/[0.035] p-2.5">

                <div className="text-[9px] uppercase tracking-wider text-white/25">
                  NO₂
                </div>

                <div className="mt-1 text-sm text-white/80">
                  {airQuality?.nitrogen_dioxide !==
                  undefined
                    ? airQuality.nitrogen_dioxide.toFixed(
                        1
                      )
                    : "--"}
                </div>

                <div className="text-[8px] text-white/25">
                  μg/m³
                </div>

              </div>

            </div>

          </div>
        </section>
      )}

      {/* =====================================
          DESKTOP AQI LEGEND
      ===================================== */}

      <section
        className="
          absolute
          bottom-5
          right-5
          z-10
          hidden
          w-[250px]
          rounded-2xl
          border
          border-white/10
          bg-black/40
          p-4
          shadow-2xl
          backdrop-blur-xl
          sm:block
          sm:bottom-8
          sm:right-8
        "
      >

        <div className="mb-3 flex items-center justify-between">

          <div>

            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/70">
              AQI Guide
            </div>

            <div className="mt-1 text-[8px] text-white/25">
              US Air Quality Index
            </div>

          </div>

        </div>

        <div className="space-y-1.5">

          {/* Good */}

          <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-[10px] text-white/65">
                Good
              </span>

            </div>

            <span className="text-[9px] text-white/30">
              0–50
            </span>

          </div>

          {/* Moderate */}

          <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-yellow-400" />

              <span className="text-[10px] text-white/65">
                Moderate
              </span>

            </div>

            <span className="text-[9px] text-white/30">
              51–100
            </span>

          </div>

          {/* Sensitive */}

          <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-orange-400" />

              <span className="max-w-[165px] text-[10px] leading-tight text-white/65">
                Unhealthy for
                sensitive groups
              </span>

            </div>

            <span className="text-[9px] text-white/30">
              101–150
            </span>

          </div>

          {/* Unhealthy */}

          <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-red-400" />

              <span className="text-[10px] text-white/65">
                Unhealthy
              </span>

            </div>

            <span className="text-[9px] text-white/30">
              151–200
            </span>

          </div>

          {/* Very Unhealthy */}

          <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-purple-400" />

              <span className="text-[10px] text-white/65">
                Very Unhealthy
              </span>

            </div>

            <span className="text-[9px] text-white/30">
              201–300
            </span>

          </div>

          {/* Hazardous */}

          <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-red-500" />

              <span className="text-[10px] text-white/65">
                Hazardous
              </span>

            </div>

            <span className="text-[9px] text-white/30">
              301–500
            </span>

          </div>

        </div>

        {/* Source note */}

        <div className="mt-3 border-t border-white/[0.06] pt-2.5">

          <p className="text-[8px] leading-relaxed text-white/20">
            AQI values use the
            US AQI scale. Data is
            model-based and may
            differ from local
            monitoring stations.
          </p>

        </div>

      </section>

      {/* =====================================
          MOBILE AQI LEGEND
      ===================================== */}

      <div className="absolute bottom-5 right-5 z-10 sm:hidden">

        {aqiGuideOpen && (
          <div
            className="
              mb-2
              w-[230px]
              rounded-2xl
              border
              border-white/10
              bg-[#071018]/90
              p-4
              shadow-2xl
              backdrop-blur-2xl
            "
          >

            <div className="mb-3">

              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/70">
                AQI Guide
              </div>

              <div className="mt-1 text-[8px] text-white/25">
                US Air Quality Index
              </div>

            </div>

            <div className="space-y-1.5">

              {/* Good */}

              <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="text-[10px] text-white/65">
                    Good
                  </span>

                </div>

                <span className="text-[9px] text-white/30">
                  0–50
                </span>

              </div>

              {/* Moderate */}

              <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-yellow-400" />

                  <span className="text-[10px] text-white/65">
                    Moderate
                  </span>

                </div>

                <span className="text-[9px] text-white/30">
                  51–100
                </span>

              </div>

              {/* Sensitive */}

              <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-orange-400" />

                  <span className="max-w-[150px] text-[10px] leading-tight text-white/65">
                    Unhealthy for
                    sensitive groups
                  </span>

                </div>

                <span className="text-[9px] text-white/30">
                  101–150
                </span>

              </div>

              {/* Unhealthy */}

              <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-red-400" />

                  <span className="text-[10px] text-white/65">
                    Unhealthy
                  </span>

                </div>

                <span className="text-[9px] text-white/30">
                  151–200
                </span>

              </div>

              {/* Very Unhealthy */}

              <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-purple-400" />

                  <span className="text-[10px] text-white/65">
                    Very Unhealthy
                  </span>

                </div>

                <span className="text-[9px] text-white/30">
                  201–300
                </span>

              </div>

              {/* Hazardous */}

              <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-2.5 py-1.5">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-red-500" />

                  <span className="text-[10px] text-white/65">
                    Hazardous
                  </span>

                </div>

                <span className="text-[9px] text-white/30">
                  301–500
                </span>

              </div>

            </div>

            <div className="mt-3 border-t border-white/[0.06] pt-2.5">

              <p className="text-[8px] leading-relaxed text-white/20">
                AQI values use the
                US AQI scale. Data is
                model-based and may
                differ from local
                monitoring stations.
              </p>

            </div>

          </div>
        )}

        <button
          onClick={() =>
            setAqiGuideOpen(
              (value) =>
                !value
            )
          }
          className="
            ml-auto
            flex
            items-center
            gap-2
            rounded-full
            border
            border-white/10
            bg-black/50
            px-3
            py-2
            text-[9px]
            text-white/55
            shadow-lg
            backdrop-blur-xl
            transition
            hover:border-white/20
            hover:bg-black/65
            hover:text-white
          "
        >

          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-cyan-300
              shadow-[0_0_8px_rgba(103,232,249,0.8)]
            "
          />

          AQI Guide

          <span className="ml-0.5 text-white/25">
            {aqiGuideOpen
              ? "×"
              : "+"}
          </span>

        </button>

      </div>

      {/* =====================================
          DEVELOPED BY
      ===================================== */}

      <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 text-center sm:bottom-3">

        <p className="whitespace-nowrap text-[9px] tracking-[0.18em] text-white/35 sm:text-[10px]">
          DEVELOPED BY{" "}
          <span className="text-white/55">
            Md. Arfan Ahmed
          </span>
        </p>

      </div>

      {/* =====================================
          VIGNETTE
      ===================================== */}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.38)_100%)]" />

    </main>
  );
}