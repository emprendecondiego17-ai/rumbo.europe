(function () {
  "use strict";

  var config = window.RUMBO_SUPABASE_CONFIG || {};
  var configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(String(config.url || "")) &&
    String(config.publishableKey || "").length > 20 && window.supabase && typeof window.supabase.createClient === "function";
  var client = configured ? window.supabase.createClient(config.url, config.publishableKey) : null;
  var session = null;
  var profile = null;
  var offerCache = [];
  var ratingCache = {};

  function profileCache(account) {
    try {
      if (account) {
        var value = JSON.stringify(account);
        sessionStorage.setItem("rumboDemoProfile", value);
        localStorage.setItem("rumboDemoProfile", value);
      } else {
        sessionStorage.removeItem("rumboDemoProfile");
        localStorage.removeItem("rumboDemoProfile");
      }
    } catch (error) { /* El servidor sigue siendo la fuente principal del perfil. */ }
  }

  function companyData(row) {
    return {
      companyName: row.company_name || "",
      taxId: row.tax_id || "",
      country: row.company_country || "",
      legalForm: row.legal_form || "",
      address: row.company_address || "",
      phone: row.company_phone || "",
      website: row.website || "",
      contactEmail: session && session.user ? session.user.email : "",
      vacancyCount: Number(row.vacancy_count || 0)
    };
  }

  function mapProfile(row) {
    return {
      id: row.id,
      name: row.full_name || "",
      email: row.contact_email || (session && session.user ? session.user.email : ""),
      role: row.role,
      phone: row.phone || "",
      city: row.city || "",
      destination: row.destination || "",
      sector: row.sector || "",
      bio: row.bio || "",
      summary: row.cv_summary || "",
      experience: row.cv_experience || "",
      education: row.cv_education || "",
      skills: row.cv_skills || "",
      languages: row.cv_languages || "",
      cvPath: row.cv_path || "",
      cvName: row.cv_name || "",
      avatarPath: row.avatar_path || "",
      company: row.role === "empresa" ? companyData(row) : null
    };
  }

  async function syncSession(nextSession) {
    session = nextSession || null;
    profile = null;
    if (!session || !session.user) {
      profileCache(null);
      return null;
    }
    var result = await client.from("profiles").select("*").eq("id", session.user.id).single();
    if (result.error) throw result.error;
    profile = mapProfile(result.data);
    if (profile.role === "candidato") {
      var candidatePublic = await client.from("candidate_public_profiles").select("avatar_path").eq("user_id", session.user.id).maybeSingle();
      if (!candidatePublic.error && candidatePublic.data) profile.avatarPath = candidatePublic.data.avatar_path || "";
    }
    profileCache(profile);
    return profile;
  }

  async function initialize() {
    if (!configured) {
      // La cuenta de prueba usa el perfil local cuando aún no se ha conectado
      // Supabase; no borrar esa sesión en cada cambio de página.
      return null;
    }
    var result = await client.auth.getSession();
    if (result.error) throw result.error;
    return syncSession(result.data.session);
  }

  var ready = initialize().catch(function (error) {
    if (configured) profileCache(null);
    console.error("Rumbo could not load the account profile:", error);
    return null;
  });

  if (configured) {
    client.auth.onAuthStateChange(function (event, nextSession) {
      window.setTimeout(function () {
        syncSession(nextSession).then(function (nextProfile) {
          window.dispatchEvent(new CustomEvent("rumbo:auth", { detail: { event: event, profile: nextProfile } }));
        }).catch(function (error) { console.error("Rumbo account update failed:", error); });
      }, 0);
    });
  }

  function requireClient() {
    if (!configured) throw new Error("La cuenta todavía no está conectada. Falta configurar el proyecto seguro de Rumbo.");
    return client;
  }

  async function signUp(email, password, formData) {
    requireClient();
    var metadata = {
      role: formData.role,
      full_name: formData.name,
      phone: formData.phone || "",
      city: formData.city || "",
      sector: formData.sector || "",
      destination: formData.destination || "",
      bio: formData.bio || "",
      company_name: formData.companyName || "",
      tax_id: formData.taxId || "",
      company_country: formData.country || "",
      legal_form: formData.legalForm || "",
      company_address: formData.address || "",
      company_phone: formData.companyPhone || "",
      website: formData.website || "",
      vacancy_count: Number(formData.vacancyCount || 0)
    };
    var result = await client.auth.signUp({
      email: email,
      password: password,
      options: { data: metadata, emailRedirectTo: formData.redirectTo || new URL("index.html", window.location.href).href }
    });
    if (result.error) throw result.error;
    if (result.data.session) await syncSession(result.data.session);
    return { session: result.data.session, user: result.data.user, profile: profile };
  }

  async function signIn(email, password, requiredRole) {
    requireClient();
    var result = await client.auth.signInWithPassword({ email: email, password: password });
    if (result.error) throw result.error;
    var activeProfile = await syncSession(result.data.session);
    if (!activeProfile) throw new Error("No se pudo cargar tu perfil. Contacta con soporte.");
    if (requiredRole && activeProfile.role !== requiredRole) {
      await client.auth.signOut();
      await syncSession(null);
      throw new Error("Esta sección requiere una cuenta de " + (requiredRole === "empresa" ? "empresa" : "persona candidata") + ". Inicia sesión con ese tipo de cuenta.");
    }
    return activeProfile;
  }

  async function signOut(redirectToHome) {
    if (configured) {
      var result = await client.auth.signOut();
      if (result.error) throw result.error;
      await syncSession(null);
    } else profileCache(null);
    if (redirectToHome !== false) window.location.href = "index.html";
  }

  async function getProfile() {
    requireClient();
    if (!session || !session.user) return null;
    var result = await client.from("profiles").select("*").eq("id", session.user.id).single();
    if (result.error) throw result.error;
    profile = mapProfile(result.data);
    profileCache(profile);
    return profile;
  }

  async function updateProfile(values) {
    requireClient();
    if (!session || !session.user) throw new Error("Inicia sesión para guardar tu perfil.");
    var fields = {
      full_name: values.name,
      phone: values.phone || "",
      city: values.city || "",
      destination: values.destination || "",
      sector: values.sector || "",
      bio: values.bio || "",
      cv_summary: values.summary || "",
      cv_experience: values.experience || "",
      cv_education: values.education || "",
      cv_skills: values.skills || "",
      cv_languages: values.languages || ""
    };
    var result = await client.from("profiles").update(fields).eq("id", session.user.id).select("*").single();
    if (result.error) throw result.error;
    var publicResult = await client.from("candidate_public_profiles").upsert({
      user_id: session.user.id,
      full_name: values.name || "",
      city: values.city || "",
      sector: values.sector || "",
      destination: values.destination || "",
      bio: values.bio || "",
      avatar_path: profile && profile.avatarPath || ""
    }, { onConflict: "user_id" });
    if (publicResult.error) throw publicResult.error;
    profile = mapProfile(result.data);
    profileCache(profile);
    return profile;
  }

  async function updateCompany(values) {
    requireClient();
    if (!session || !profile || profile.role !== "empresa") throw new Error("Inicia sesión como empresa para guardar estos datos.");
    var result = await client.from("profiles").update({
      full_name: values.contactName || profile.name,
      company_name: values.companyName,
      tax_id: values.taxId,
      company_country: values.country,
      legal_form: values.legalForm || "",
      company_address: values.address,
      company_phone: values.phone,
      website: values.website || "",
      vacancy_count: Number(values.vacancyCount || 0)
    }).eq("id", session.user.id).select("*").single();
    if (result.error) throw result.error;
    profile = mapProfile(result.data);
    profileCache(profile);
    return profile;
  }

  async function saveCvData(values) {
    requireClient();
    if (!session || !profile || profile.role !== "candidato") throw new Error("Inicia sesión como persona candidata para guardar el CV.");
    var result = await client.from("profiles").update({
      cv_summary: values.summary || "",
      cv_experience: values.experience || "",
      cv_education: values.education || "",
      cv_skills: values.skills || "",
      cv_languages: values.languages || ""
    }).eq("id", session.user.id).select("*").single();
    if (result.error) throw result.error;
    profile = mapProfile(result.data);
    profileCache(profile);
    return profile;
  }

  async function uploadCv(file) {
    requireClient();
    if (!session || !profile || profile.role !== "candidato") throw new Error("Inicia sesión como persona candidata para subir el CV.");
    var safeName = String(file.name || "curriculum").replace(/[^a-z0-9._-]/gi, "-").slice(-100);
    var path = session.user.id + "/" + Date.now() + "-" + safeName;
    var upload = await client.storage.from("rumbo-cvs").upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
    if (upload.error) throw upload.error;
    if (profile.cvPath) await client.storage.from("rumbo-cvs").remove([profile.cvPath]);
    var saved = await client.from("profiles").update({ cv_path: path, cv_name: file.name }).eq("id", session.user.id).select("*").single();
    if (saved.error) throw saved.error;
    profile = mapProfile(saved.data);
    profileCache(profile);
    return profile;
  }

  async function uploadAvatar(file) {
    requireClient();
    if (!session || !profile || profile.role !== "candidato") throw new Error("Inicia sesión como persona candidata para subir una foto.");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 2000000) throw new Error("Elige una imagen JPG, PNG o WEBP de hasta 2 MB.");
    var path = session.user.id + "/" + Date.now() + "-perfil." + (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg");
    var upload = await client.storage.from("rumbo-avatars").upload(path, file, { upsert: false, contentType: file.type });
    if (upload.error) throw upload.error;
    var publicResult = await client.from("candidate_public_profiles").upsert({ user_id: session.user.id, full_name: profile.name || "", city: profile.city || "", sector: profile.sector || "", destination: profile.destination || "", bio: profile.bio || "", avatar_path: path }, { onConflict: "user_id" });
    if (publicResult.error) throw publicResult.error;
    if (profile.avatarPath) await client.storage.from("rumbo-avatars").remove([profile.avatarPath]);
    profile.avatarPath = path;
    profileCache(profile);
    return profile;
  }

  async function getMyAvatarUrl() {
    requireClient();
    if (!profile || !profile.avatarPath) return "";
    var result = await client.storage.from("rumbo-avatars").createSignedUrl(profile.avatarPath, 900);
    if (result.error) throw result.error;
    return result.data.signedUrl;
  }

  async function removeCv() {
    requireClient();
    if (!session || !profile || profile.role !== "candidato") throw new Error("Inicia sesión para eliminar el CV.");
    if (profile.cvPath) {
      var removed = await client.storage.from("rumbo-cvs").remove([profile.cvPath]);
      if (removed.error) throw removed.error;
    }
    var saved = await client.from("profiles").update({ cv_path: "", cv_name: "" }).eq("id", session.user.id).select("*").single();
    if (saved.error) throw saved.error;
    profile = mapProfile(saved.data);
    profileCache(profile);
    return profile;
  }

  async function getCvDownloadUrl() {
    requireClient();
    if (!profile || !profile.cvPath) return null;
    var result = await client.storage.from("rumbo-cvs").createSignedUrl(profile.cvPath, 60);
    if (result.error) throw result.error;
    return result.data.signedUrl;
  }

  async function loadOffers() {
    if (!configured) return [];
    var result = await client.from("job_offers").select("*").order("created_at", { ascending: false });
    if (result.error) throw result.error;
    ratingCache = {};
    var applicationStatusCache = {};
    if (session && profile && profile.role === "candidato") {
      var ratings = await client.from("offer_ratings").select("offer_id,stars").eq("candidate_id", session.user.id);
      if (!ratings.error) (ratings.data || []).forEach(function (rating) { ratingCache[rating.offer_id] = rating.stars; });
      var applications = await client.from("offer_applications").select("offer_id,status").eq("candidate_id", session.user.id);
      if (!applications.error) (applications.data || []).forEach(function (application) { applicationStatusCache[application.offer_id] = application.status; });
    }
    offerCache = (result.data || []).map(function (row) {
      var durations = row.contract_type === "corta" ? ["corta"] : ["larga"];
      return {
        id: row.id,
        isDemo: false,
        isCompanyOffer: true,
        sponsored: !!row.sponsored,
        ownerId: row.company_id,
        company: row.company_name,
        title: row.title,
        country: row.country,
        location: row.location || "Ubicación no indicada",
        sector: row.sector,
        sectorLabel: row.sector_label,
        durations: durations,
        durationLabel: row.duration_label,
        salary: row.salary || "Salario no indicado",
        housing: row.housing || "No indicado",
        deadline: row.deadline || "Consulta a la empresa para confirmar disponibilidad.",
        details: row.details || "",
        url: row.application_email ? "mailto:" + encodeURIComponent(row.application_email).replace(/%40/gi, "@") : (row.application_url || "#"),
        applicationEmail: row.application_email || "",
        promotionRequested: !!row.promotion_requested,
        source: "Rumbo",
        vacancies: Number(row.vacancies || 1),
        averageRating: Number(row.average_rating || 0),
        ratingCount: Number(row.rating_count || 0),
        favoritesCount: Number(row.favorites_count || 0),
        viewsCount: Number(row.views_count || 0),
        userRating: ratingCache[row.id] || 0,
        applicationStatus: applicationStatusCache[row.id] || "",
        isActive: !!row.is_active,
        createdAt: row.created_at
      };
    });
    window.RUMBO_CLOUD_OFFERS = offerCache.slice();
    window.dispatchEvent(new CustomEvent("rumbo:offers", { detail: offerCache }));
    return offerCache;
  }

  async function createOffer(values) {
    requireClient();
    if (!profile || profile.role !== "empresa") throw new Error("Inicia sesión como empresa para publicar.");
    if (!profile.company || !profile.company.companyName) throw new Error("Completa primero el perfil legal de tu empresa.");
    var result = await client.from("job_offers").insert({
      company_id: session.user.id,
      company_name: profile.company.companyName,
      title: values.title,
      country: values.country,
      location: values.location || "",
      sector: values.sectorKey,
      sector_label: values.sectorLabel,
      contract_type: values.contractType,
      duration_label: values.durationLabel,
      vacancies: Number(values.vacancies || 1),
      salary: values.salary || "",
      housing: values.housing || "",
      deadline: values.deadline || "",
      details: values.details || "",
      application_email: session.user.email || "",
      promotion_requested: !!values.promotionRequested,
      is_active: true
    }).select("id").single();
    if (result.error) throw result.error;
    await loadOffers();
    return result.data;
  }

  async function toggleFavorite(offerId) {
    requireClient();
    if (!session || !profile || profile.role !== "candidato") throw new Error("Inicia sesión como persona candidata para guardar ofertas.");
    var existing = await client.from("offer_favorites").select("offer_id").eq("offer_id", offerId).eq("candidate_id", session.user.id).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      var removed = await client.from("offer_favorites").delete().eq("offer_id", offerId).eq("candidate_id", session.user.id);
      if (removed.error) throw removed.error;
      return false;
    }
    var added = await client.from("offer_favorites").insert({ offer_id: offerId });
    if (added.error) throw added.error;
    return true;
  }

  async function loadFavoriteIds() {
    requireClient();
    if (!session || !profile || profile.role !== "candidato") return [];
    var result = await client.from("offer_favorites").select("offer_id").eq("candidate_id", session.user.id);
    if (result.error) throw result.error;
    return (result.data || []).map(function (row) { return row.offer_id; });
  }

  async function getSavedOffers() {
    var ids = await loadFavoriteIds();
    if (!offerCache.length) await loadOffers();
    return offerCache.filter(function (offer) { return ids.indexOf(offer.id) !== -1; }).map(function (offer) {
      return Object.assign({}, offer, { key: offer.id });
    });
  }

  async function recordView(offerId) {
    if (!configured || !session || !profile || profile.role !== "candidato" || !offerId) return;
    var sessionId = sessionStorage.getItem("rumboViewSessionId");
    if (!sessionId) {
      if (window.crypto && window.crypto.randomUUID) sessionId = window.crypto.randomUUID();
      else {
        var random = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(random);
        else for (var index = 0; index < random.length; index += 1) random[index] = Math.floor(Math.random() * 256);
        random[6] = (random[6] & 15) | 64;
        random[8] = (random[8] & 63) | 128;
        var hex = Array.from(random).map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
        sessionId = hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
      }
      sessionStorage.setItem("rumboViewSessionId", sessionId);
    }
    var result = await client.from("offer_views").upsert({ offer_id: offerId, session_id: sessionId }, { onConflict: "offer_id,candidate_id,session_id", ignoreDuplicates: true });
    if (result.error) throw result.error;
  }

  async function rateOffer(offerId, stars) {
    requireClient();
    if (!session || !profile || profile.role !== "candidato") throw new Error("Solo las personas candidatas pueden valorar ofertas.");
    var result = await client.from("offer_ratings").upsert({ offer_id: offerId, stars: Number(stars) }, { onConflict: "offer_id,candidate_id" });
    if (result.error) throw result.error;
    return loadOffers();
  }

  async function getCompanyDashboard() {
    requireClient();
    if (!session || !profile || profile.role !== "empresa") throw new Error("Esta área requiere una cuenta de empresa.");
    var results = await Promise.all([
      client.from("job_offers").select("*").eq("company_id", session.user.id).order("created_at", { ascending: false }),
      client.from("offer_favorites").select("offer_id,candidate_id,created_at"),
      client.from("offer_views").select("offer_id,candidate_id,created_at"),
      client.from("candidate_pipeline").select("offer_id,candidate_id,stage,updated_at"),
      client.from("offer_applications").select("offer_id,candidate_id,status,cover_note,created_at,updated_at")
    ]);
    results.forEach(function (result) { if (result.error) throw result.error; });
    var offers = (results[0].data || []).map(function (row) {
      return offerCache.find(function (offer) { return offer.id === row.id; }) || {
        id: row.id, company: row.company_name, title: row.title, country: row.country, location: row.location,
        vacancies: Number(row.vacancies || 1), sectorLabel: row.sector_label
      };
    });
    var ownIds = offers.map(function (offer) { return offer.id; });
    var favorites = (results[1].data || []).filter(function (row) { return ownIds.indexOf(row.offer_id) !== -1; });
    var views = (results[2].data || []).filter(function (row) { return ownIds.indexOf(row.offer_id) !== -1; });
    var pipeline = (results[3].data || []).filter(function (row) { return ownIds.indexOf(row.offer_id) !== -1; });
    var applications = (results[4].data || []).filter(function (row) { return ownIds.indexOf(row.offer_id) !== -1; });
    var candidateIds = [];
    favorites.concat(views, pipeline, applications).forEach(function (row) { if (candidateIds.indexOf(row.candidate_id) === -1) candidateIds.push(row.candidate_id); });
    var candidateProfiles = {};
    if (candidateIds.length) {
      var candidates = await client.from("candidate_public_profiles").select("user_id,full_name,city,sector,destination,bio,avatar_path").in("user_id", candidateIds);
      if (candidates.error) throw candidates.error;
      for (var candidate of (candidates.data || [])) {
        var avatarUrl = "";
        if (candidate.avatar_path) {
          var signedAvatar = await client.storage.from("rumbo-avatars").createSignedUrl(candidate.avatar_path, 900);
          if (!signedAvatar.error) avatarUrl = signedAvatar.data.signedUrl;
        }
        candidateProfiles[candidate.user_id] = Object.assign({}, candidate, { avatarUrl: avatarUrl });
      }
    }
    return { offers: offers, favorites: favorites, views: views, pipeline: pipeline, applications: applications, candidates: candidateProfiles };
  }

  async function applyToOffer(offerId, coverNote) {
    requireClient();
    if (!session || !profile || profile.role !== "candidato") throw new Error("Inicia sesión como persona candidata para solicitar este puesto.");
    var result = await client.from("offer_applications").insert({ offer_id: offerId, cover_note: coverNote || "" });
    if (result.error && result.error.code !== "23505") throw result.error;
    return true;
  }

  async function getCandidateDetail(candidateId, offerId) {
    requireClient();
    if (!session || !profile || profile.role !== "empresa") throw new Error("Esta ficha solo está disponible para una cuenta de empresa.");
    var offer = await client.from("job_offers").select("id,company_id,title,company_name").eq("id", offerId).eq("company_id", session.user.id).single();
    if (offer.error) throw new Error("No encontramos esta oferta en tu empresa.");
    var results = await Promise.all([
      client.from("candidate_public_profiles").select("user_id,full_name,city,sector,destination,bio,avatar_path").eq("user_id", candidateId).single(),
      client.from("candidate_pipeline").select("stage").eq("offer_id", offerId).eq("candidate_id", candidateId).maybeSingle(),
      client.from("offer_applications").select("status,cover_note,created_at").eq("offer_id", offerId).eq("candidate_id", candidateId).maybeSingle()
    ]);
    results.forEach(function (result) { if (result.error) throw result.error; });
    var candidate = results[0].data;
    var stage = results[1].data && results[1].data.stage || "";
    var application = results[2].data || null;
    var full = null;
    if (stage === "proceso" || stage === "contratado") {
      var profileResult = await client.from("profiles").select("contact_email,phone,cv_summary,cv_experience,cv_education,cv_skills,cv_languages,cv_path,cv_name").eq("id", candidateId).single();
      if (profileResult.error) throw profileResult.error;
      full = profileResult.data;
    }
    var avatarUrl = "";
    if (candidate.avatar_path) {
      var image = await client.storage.from("rumbo-avatars").createSignedUrl(candidate.avatar_path, 900);
      if (!image.error) avatarUrl = image.data.signedUrl;
    }
    var cvUrl = "";
    if (full && full.cv_path) {
      var file = await client.storage.from("rumbo-cvs").createSignedUrl(full.cv_path, 300);
      if (!file.error) cvUrl = file.data.signedUrl;
    }
    return { offer: offer.data, candidate: candidate, stage: stage, application: application, full: full, avatarUrl: avatarUrl, cvUrl: cvUrl };
  }

  async function setCandidateStage(offerId, candidateId, stage) {
    requireClient();
    if (!session || !profile || profile.role !== "empresa") throw new Error("Inicia sesión como empresa para gestionar candidaturas.");
    var result = await client.from("candidate_pipeline").upsert({ offer_id: offerId, candidate_id: candidateId, stage: stage, updated_at: new Date().toISOString() }, { onConflict: "offer_id,candidate_id" });
    if (result.error) throw result.error;
    var applicationStatus = stage === "contratado" ? "contratada" : "proceso";
    var applicationUpdate = await client.from("offer_applications").update({ status: applicationStatus, updated_at: new Date().toISOString() }).eq("offer_id", offerId).eq("candidate_id", candidateId);
    if (applicationUpdate.error) throw applicationUpdate.error;
  }

  async function setApplicationStatus(offerId, candidateId, status) {
    requireClient();
    if (!session || !profile || profile.role !== "empresa") throw new Error("Inicia sesión como empresa para gestionar solicitudes.");
    var result = await client.from("offer_applications").update({ status: status, updated_at: new Date().toISOString() }).eq("offer_id", offerId).eq("candidate_id", candidateId);
    if (result.error) throw result.error;
    if (status === "descartada") {
      var removed = await client.from("candidate_pipeline").delete().eq("offer_id", offerId).eq("candidate_id", candidateId);
      if (removed.error) throw removed.error;
    }
  }

  function subscribeTables(name, tables, callback) {
    if (!configured) return function () {};
    var channel = client.channel(name);
    tables.forEach(function (table) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: table }, callback);
    });
    channel.subscribe();
    return function () { client.removeChannel(channel); };
  }

  var api = {
    isConfigured: configured,
    ready: ready,
    client: client,
    getCurrentProfile: function () { return profile; },
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getProfile: getProfile,
    updateProfile: updateProfile,
    updateCompany: updateCompany,
    saveCvData: saveCvData,
    uploadCv: uploadCv,
    removeCv: removeCv,
    getCvDownloadUrl: getCvDownloadUrl,
    loadOffers: loadOffers,
    createOffer: createOffer,
    toggleFavorite: toggleFavorite,
    loadFavoriteIds: loadFavoriteIds,
    getSavedOffers: getSavedOffers,
    recordView: recordView,
    rateOffer: rateOffer,
    getCompanyDashboard: getCompanyDashboard,
    getCandidateDetail: getCandidateDetail,
    applyToOffer: applyToOffer,
    setApplicationStatus: setApplicationStatus,
    uploadAvatar: uploadAvatar,
    getMyAvatarUrl: getMyAvatarUrl,
    setCandidateStage: setCandidateStage,
    subscribeOffers: function (callback) { return subscribeTables("rumbo-offers-live", ["job_offers"], callback); },
    subscribeCandidateData: function (callback) { return subscribeTables("rumbo-candidate-live", ["offer_favorites", "offer_views", "offer_ratings", "job_offers"], callback); },
    subscribeCompanyData: function (callback) { return subscribeTables("rumbo-company-live-" + (session && session.user ? session.user.id : "guest"), ["job_offers", "offer_favorites", "offer_views", "candidate_pipeline", "offer_applications", "candidate_public_profiles"], callback); }
  };
  window.RumboCloud = api;
}());
