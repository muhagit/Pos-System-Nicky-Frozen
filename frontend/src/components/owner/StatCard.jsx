import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";
const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  naik,
}) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* TOP ROW */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-text-secondary leading-tight max-w-[70%]">
          {label}
        </p>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          <Icon size={18} className={iconColor} />
        </div>
      </div>

      {/* VALUE */}
      <div>
        <p className="text-2xl font-bold text-text">{value}</p>
        {sub && (
          <div className="flex items-center gap-1 mt-1">
            {naik ? (
              <FiArrowUpRight size={12} className="text-success" />
            ) : (
              <FiArrowDownRight size={12} className="text-danger" />
            )}
            <p
              className={`text-xs font-medium ${
                naik ? "text-success" : "text-danger"
              }`}
            >
              {sub}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
