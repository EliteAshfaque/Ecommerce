import { Truck, Shield, Headphones, CreditCard } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "UAE delivery",
    description: "Complimentary Standard delivery on orders over AED 250.",
  },
  {
    icon: Shield,
    title: "Secure payment",
    description: "Stripe-powered card payments with clear AED totals.",
  },
  {
    icon: Headphones,
    title: "Order support",
    description: "Send our Dubai team a note and receive a response in one business day.",
  },
  {
    icon: CreditCard,
    title: "Clear fulfilment",
    description: "Standard or Express delivery choices for every Emirate at checkout.",
  },
];

const FeatureSection = () => {
  return (
    <section className="py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="glass-card animate-smooth glow-on-hover rounded-3xl p-7 text-center"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="gradient-primary mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
              <feature.icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
