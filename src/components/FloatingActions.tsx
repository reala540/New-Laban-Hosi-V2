import { MessageCircle, PhoneCall } from 'lucide-react'

export default function FloatingActions() {
  return (
    <div className="fab-stack">
      <a
        href="tel:0717405323"
        className="fab fab-emergency"
        aria-label="Call emergency line"
        title="Call emergency line"
      >
        <PhoneCall size={24} />
      </a>
      <a
        href="https://wa.me/254717405323"
        target="_blank"
        rel="noopener noreferrer"
        className="fab fab-whatsapp"
        aria-label="Chat with us on WhatsApp"
        title="Chat on WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    </div>
  )
}
