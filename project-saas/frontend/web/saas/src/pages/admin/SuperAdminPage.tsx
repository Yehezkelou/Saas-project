import { useEffect, useState } from "react";
import { SubscriptionApi } from "../../api";
import { Button, LoadingPage, Card, StatCard } from "../../components/ui";
import { 
  FiCheck, FiSearch, FiMail, FiCalendar, 
  FiPause, FiTrash2, FiZap, FiPlay,
  FiHome, FiClock, FiActivity, FiPackage,
  FiCoffee, FiShoppingBag, FiGlobe
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmActionModal } from "../../components/cardconfirm/ConfirmActionModal";

interface TenantWithSub {
  id: string;
  name: string;
  businessType: string;
  createdAt: string;
  users: { email: string }[];
  subscription: {
    id: string;
    plan: string;
    pendingPlan?: string | null;
    status: "ACTIVE" | "PENDING" | "SUSPENDED" | "EXPIRED";
  } | null;
}

interface GlobalStats {
  totalTenants: number;
  pendingTenants: number;
  activeTenants: number;
  totalOrders: number;
}

export function SuperAdminPage() {
  const [tenants, setTenants] = useState<TenantWithSub[]>([]);
  const [stats,   setStats]   = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<"ALL" | "PENDING" | "ACTIVE" | "SUSPENDED">("ALL");

  // Modal State
  const [modal, setModal] = useState<{
    open: boolean;
    type: "delete" | "suspend" | "activate" | "verify" | "reject" | "change_plan";
    tenantId: string;
    title: string;
    message: string;
    requireText?: string;
    payload?: any;
  }>({
    open: false,
    type: "verify",
    tenantId: "",
    title: "",
    message: ""
  });

  const fetchData = async () => {
    try {
      const tenantsData = await SubscriptionApi.listAll();
      const statsData = await SubscriptionApi.getStats();
      
      if (Array.isArray(tenantsData)) {
        setTenants(tenantsData);
      }
      if (statsData) {
        setStats(statsData);
      }
    } catch (e) {
      console.error("Failed to fetch system data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type: any, tenantId: string, title: string, message: string, requireText?: string, payload?: any) => {
    setModal({ open: true, type, tenantId, title, message, requireText, payload });
  };

  const executeAction = async () => {
    const { type, tenantId } = modal;
    try {
      if (type === "verify")   await SubscriptionApi.verify(tenantId);
      if (type === "suspend")  await SubscriptionApi.suspend(tenantId);
      if (type === "activate") await SubscriptionApi.activate(tenantId);
      if (type === "delete")   await SubscriptionApi.deleteTenant(tenantId);
      if (type === "reject")   await SubscriptionApi.reject(tenantId);
      if (type === "change_plan") await SubscriptionApi.adminChangePlan(tenantId, modal.payload);
      await fetchData();
    } catch (e) {
      alert("Erreur lors de l'opération");
    }
  };

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.users[0]?.email.toLowerCase().includes(search.toLowerCase());
    
    if (filter === "PENDING") {
      return matchesSearch && (t.subscription?.status === "PENDING" || !!t.subscription?.pendingPlan);
    }
    
    const matchesFilter = filter === "ALL" || t.subscription?.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <LoadingPage message="Chargement du centre de contrôle..." />;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "40px 24px", background: "var(--color-bg)", fontFamily: "var(--font)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 style={{ fontSize: 40, fontWeight: 900, color: "var(--color-text-primary)", marginBottom: 12, letterSpacing: "-1px" }}>
              System <span style={{ color: "var(--color-primary)" }}>Monitoring</span>
            </h1>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: 16, fontWeight: 500 }}>
              Contrôle global de la plateforme SaaS et gestion des établissements.
            </p>
          </motion.div>

          <div style={{ display: "flex", background: "var(--color-surface)", padding: 6, borderRadius: "16px", border: "1px solid var(--color-border-light)", flexWrap: "wrap", gap: 4 }}>
             {["ALL", "PENDING", "ACTIVE", "SUSPENDED"].map((f) => (
               <button
                 key={f}
                 onClick={() => setFilter(f as any)}
                 style={{
                   padding: "10px 20px", borderRadius: "12px", border: "none", cursor: "pointer",
                   fontSize: 14, fontWeight: 700, transition: "all 0.2s",
                   background: filter === f ? "var(--color-text-primary)" : "transparent",
                   color: filter === f ? "var(--color-surface)" : "var(--color-text-secondary)"
                 }}
               >
                 {f === "ALL" ? "Tous" : f === "PENDING" ? "À valider" : f === "ACTIVE" ? "Actifs" : "Suspendus"}
               </button>
             ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 48 }}>
           <StatCard icon={<FiHome />} label="Établissements" value={stats?.totalTenants.toString() || "0"} sub="Total inscrits" />
           <StatCard icon={<FiClock />} label="En attente" value={stats?.pendingTenants.toString() || "0"} color="#F39C12" sub="Nouveaux comptes" />
           <StatCard icon={<FiActivity />} label="Actifs" value={stats?.activeTenants.toString() || "0"} color="#2ECC71" sub="Abonnements OK" />
           <StatCard icon={<FiPackage />} label="Commandes" value={stats?.totalOrders.toString() || "0"} color="var(--color-primary)" sub="Flux total" />
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: 32 }}>
          <FiSearch style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} size={20} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un restaurant par nom ou email propriétaire..."
            style={{ 
              width: "100%", background: "var(--color-surface)", border: "2px solid var(--color-border-light)", 
              borderRadius: "20px", padding: "20px 24px 20px 64px", color: "var(--color-text-primary)", 
              fontSize: 16, fontWeight: 600, outline: "none", transition: "all 0.2s",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; e.target.style.background = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--color-border-light)"; e.target.style.background = "var(--color-surface)"; }}
          />
        </div>

        {/* Main List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((tenant) => (
              <motion.div
                key={tenant.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card padding="none" style={{ borderRadius: "24px", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", padding: "24px", flexWrap: "wrap", gap: 24 }}>
                    
                    {/* Info */}
                    <div style={{ flex: 1, display: "flex", gap: 20, alignItems: "center", minWidth: 300 }}>
                      <div style={{ 
                        width: 72, height: 72, background: tenant.subscription?.status === "PENDING" ? "rgba(243,156,18,0.1)" : "rgba(255,107,0,0.1)", 
                        borderRadius: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
                        color: tenant.subscription?.status === "PENDING" ? "#F39C12" : "var(--color-primary)"
                      }}>
                         {tenant.businessType === "RESTAURANT" ? <FiCoffee /> : <FiShoppingBag />}
                      </div>
                      <div>
                         <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 6px" }}>{tenant.name}</h3>
                         <div style={{ display: "flex", flexWrap: "wrap", gap: 16, color: "var(--color-text-tertiary)", fontSize: 14, fontWeight: 600 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiMail /> {tenant.users[0]?.email}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiCalendar /> {new Date(tenant.createdAt).toLocaleDateString()}</span>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                               <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiZap color="var(--color-primary)" /> {tenant.subscription?.plan}</span>
                               <select 
                                 value={tenant.subscription?.plan}
                                 onChange={(e) => {
                                   const newPlan = e.target.value;
                                   if (newPlan !== tenant.subscription?.plan) {
                                     openModal("change_plan", tenant.id, "Changer le forfait", `Voulez-vous forcer le passage au plan ${newPlan} pour ${tenant.name} ?`, undefined, newPlan);
                                   }
                                 }}
                                 style={{ 
                                   background: "transparent", border: "1px solid var(--color-border-light)", 
                                   borderRadius: "6px", color: "var(--color-text-tertiary)", fontSize: "11px",
                                   cursor: "pointer", outline: "none", padding: "2px 4px"
                                 }}
                               >
                                 <option value="FREE">FREE</option>
                                 <option value="PRO">PRO</option>
                                 <option value="BUSINESS">BUSINESS</option>
                               </select>

                               {tenant.subscription?.pendingPlan && (
                                 <span style={{ 
                                   background: "rgba(255,107,0,0.1)", color: "var(--color-primary)", 
                                   padding: "2px 8px", borderRadius: "6px", fontSize: "11px", border: "1px dashed var(--color-primary)" 
                                 }}>
                                   ➜ Attente : {tenant.subscription.pendingPlan}
                                 </span>
                               )}
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                       
                       {/* Status Tag */}
                       <div style={{ 
                         fontSize: 12, fontWeight: 900, padding: "8px 16px", borderRadius: "100px", letterSpacing: 1,
                         background: tenant.subscription?.status === "PENDING" ? "#F39C1220" : 
                                     tenant.subscription?.status === "ACTIVE" ? "#2ECC7120" : "#E74C3C20",
                         color: tenant.subscription?.status === "PENDING" ? "#F39C12" : 
                                tenant.subscription?.status === "ACTIVE" ? "#2ECC71" : "#E74C3C",
                       }}>
                         {tenant.subscription?.status}
                       </div>

                       <div style={{ width: 1, height: 32, background: "var(--color-border-light)", margin: "0 8px" }} />

                       <div style={{ display: "flex", gap: 10 }}>
                         {(tenant.subscription?.status === "PENDING" || tenant.subscription?.pendingPlan) && (
                           <div style={{ display: "flex", gap: 10 }}>
                             <Button variant="primary" onClick={() => openModal("verify", tenant.id, "Valider l'établissement", 
                               tenant.subscription?.pendingPlan 
                                 ? `Souhaitez-vous valider le passage au plan ${tenant.subscription.pendingPlan} pour ${tenant.name} ?`
                                 : `Souhaitez-vous valider l'accès pour ${tenant.name} ?`
                             )}>
                                <FiCheck size={18} /> Valider
                             </Button>

                             {tenant.subscription?.pendingPlan && (
                               <Button variant="outline" onClick={() => openModal("reject", tenant.id, "Refuser la demande", `Voulez-vous refuser le changement de plan pour ${tenant.name} ?`)}>
                                  Refuser
                               </Button>
                             )}
                           </div>
                         )}

                         {tenant.subscription?.status === "ACTIVE" && !tenant.subscription?.pendingPlan && (
                           <Button variant="outline" onClick={() => openModal("suspend", tenant.id, "Suspendre l'abonnement", `L'établissement ${tenant.name} perdra l'accès immédiat au service.`, "SUSPENDRE")}>
                              <FiPause size={18} /> Suspendre
                           </Button>
                         )}

                         {tenant.subscription?.status === "SUSPENDED" && (
                           <Button variant="success" onClick={() => openModal("activate", tenant.id, "Réactiver l'abonnement", `Redonner l'accès complet à ${tenant.name} ?`)}>
                              <FiPlay size={18} /> Activer
                           </Button>
                         )}

                         <button 
                           onClick={() => openModal("delete", tenant.id, "Suppression Définitive", `Êtes-vous certain de vouloir supprimer ${tenant.name} ? Cette action est irréversible.`, "SUPPRIMER")}
                           style={{ 
                             width: 44, height: 44, borderRadius: "14px", border: "1px solid #ff4d4d20", 
                             background: "#ff4d4d10", color: "#ff4d4d", cursor: "pointer",
                             display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                           }}
                           onMouseEnter={(e) => { 
                              e.currentTarget.style.background = "#ff4d4d"; 
                              e.currentTarget.style.color = "#ffffff"; 
                           }}
                           onMouseLeave={(e) => { 
                              e.currentTarget.style.background = "#ff4d4d10"; 
                              e.currentTarget.style.color = "#ff4d4d"; 
                           }}
                         >
                           <FiTrash2 size={20} />
                         </button>
                       </div>
                    </div>

                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "100px 0" }}>
               <div style={{ fontSize: 80, marginBottom: 24, opacity: 0.1, color: "var(--color-text-secondary)" }}>
                 <FiGlobe style={{ margin: "0 auto" }} />
               </div>
               <h3 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-secondary)" }}>Aucun établissement trouvé</h3>
               <p style={{ color: "var(--color-text-tertiary)" }}>Essayez de modifier vos filtres ou votre recherche.</p>
            </motion.div>
          )}
        </div>
      </div>

      <ConfirmActionModal 
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        onConfirm={executeAction}
        title={modal.title}
        message={modal.message}
        type={modal.type === "change_plan" ? "verify" : modal.type as any}
        requireText={modal.requireText}
      />
    </div>
  );
}
