import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { feedbackSchema, FeedbackFormValues } from "@/lib/feedback-schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function FeedbackPainel() {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      comments: "",
      workingWell: "",
      toImprove: "",
    },
  });

  async function onSubmit(data: FeedbackFormValues) {
    const toastId = toast.loading("Enviando seu feedback anonimamente...");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resposta = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof resposta?.error === "string" ? resposta.error : "Erro ao enviar");
      }

      toast.success("Feedback enviado com sucesso!", {
        id: toastId,
        description: "Obrigado por contribuir com a equipe.",
      });
      form.reset();
    } catch (error) {
      toast.error("Erro ao enviar o feedback", {
        id: toastId,
        description: "Tente novamente ou fale com um administrador.",
      });
      console.error("Erro ao enviar feedback:", error);
    }
  }

  const scaleQuestions = [
    { name: "welcomed", label: "1. Você se sente bem acolhido(a) na equipe?" },
    { name: "communication", label: "2. A comunicação da equipe é clara?" },
    { name: "responsibilities", label: "3. Você entende bem suas responsabilidades?" },
    { name: "learning", label: "4. Você sente que está aprendendo e evoluindo?" },
    { name: "organization", label: "5. Como você avalia a organização da equipe?" },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Anônimo</CardTitle>
        <CardDescription>
          Melhore nossa equipe com sua opinião sincera.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mx-auto max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {scaleQuestions.map((q) => (
                <FormField
                  key={q.name}
                  control={form.control}
                  name={q.name}
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-lg font-medium">{q.label}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex justify-between sm:justify-start sm:gap-10"
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <div key={val} className="flex flex-col items-center space-y-2">
                              <RadioGroupItem value={val.toString()} id={`${q.name}-${val}`} />
                              <label htmlFor={`${q.name}-${val}`} className="text-sm cursor-pointer">{val}</label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <FormField
                control={form.control}
                name="workingWell"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium text-left block">6. O que mais funciona bem?</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toImprove"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium text-left block">7. O que precisa melhorar?</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium text-left block">8. Sugestão final (Opcional)</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-lg font-semibold">
                Enviar Feedback
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}