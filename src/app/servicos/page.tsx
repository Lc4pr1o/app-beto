export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Clock, DollarSign, Package } from "lucide-react";
import { NewServiceModal, EditServiceModal } from "@/components/service-modal";

export default async function ServicosPage() {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Serviços</h2>
          <p className="text-gray-500 text-sm">
            {services.length} serviço{services.length !== 1 ? "s" : ""} cadastrado{services.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NewServiceModal />
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Nenhum serviço cadastrado ainda.</p>
          <p className="text-gray-400 text-sm mt-1">
            Cadastre seus serviços para usar ao criar atendimentos.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <Package size={16} className="text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {service.durationMins} min
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <DollarSign size={10} />
                      R$ {service.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!service.active && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    Inativo
                  </span>
                )}
                <EditServiceModal service={service} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
