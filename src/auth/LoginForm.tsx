import { useReducer } from "react";
import { z } from "zod";
import { getStateInstance, type StateInstance } from "@/api/greenApiClient";
import { useAuthStore } from "@/auth/authStore";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Label } from "@/lib/ui/label";

const loginSchema = z.object({
  idInstance: z
    .string()
    .trim()
    .min(1, "Введите idInstance")
    .regex(/^\d+$/, "idInstance состоит только из цифр"),
  apiTokenInstance: z.string().trim().min(1, "Введите apiTokenInstance"),
});

type LoginField = keyof z.infer<typeof loginSchema>;

type LoginForm = { idInstance: string; apiTokenInstance: string };
type LoginFieldErrors = Partial<Record<LoginField, string>>;

type LoginFormState = {
  form: LoginForm;
  fieldErrors: LoginFieldErrors;
  formError: string | undefined;
  status: "idle" | "submitting";
};

type LoginFormAction =
  | { type: "setIdInstance"; value: string }
  | { type: "setApiTokenInstance"; value: string }
  | { type: "fieldValidated"; field: LoginField; error: string | undefined }
  | { type: "formValidated"; errors: LoginFieldErrors }
  | { type: "submitStarted" }
  | { type: "submitFailed"; fieldErrors?: LoginFieldErrors; formError?: string }
  | { type: "submitSucceeded" };

const initialState: LoginFormState = {
  form: { idInstance: "", apiTokenInstance: "" },
  fieldErrors: {},
  formError: undefined,
  status: "idle",
};

const stateInstanceMessages: Partial<Record<StateInstance, string>> = {
  notAuthorized:
    "Инстанс не авторизован в GREEN-API — авторизуйте его в личном кабинете",
  blocked: "Аккаунт заблокирован GREEN-API",
  suspended: "На аккаунте временные ограничения на отправку сообщений",
  starting: "Инстанс ещё запускается, попробуйте через минуту",
  pendingPassword:
    "Инстансу требуется пароль двухфакторной авторизации в личном кабинете GREEN-API",
};

function loginFormReducer(
  state: LoginFormState,
  action: LoginFormAction,
): LoginFormState {
  switch (action.type) {
    case "setIdInstance":
      return {
        ...state,
        form: { ...state.form, idInstance: action.value },
        fieldErrors: { ...state.fieldErrors, idInstance: undefined },
      };
    case "setApiTokenInstance":
      return {
        ...state,
        form: { ...state.form, apiTokenInstance: action.value },
        fieldErrors: { ...state.fieldErrors, apiTokenInstance: undefined },
      };
    case "fieldValidated":
      return {
        ...state,
        fieldErrors: { ...state.fieldErrors, [action.field]: action.error },
      };
    case "formValidated":
      return { ...state, fieldErrors: action.errors };
    case "submitStarted":
      return { ...state, status: "submitting", formError: undefined };
    case "submitFailed":
      return {
        ...state,
        status: "idle",
        fieldErrors: action.fieldErrors ?? state.fieldErrors,
        formError: action.formError,
      };
    case "submitSucceeded":
      return { ...state, status: "idle" };
  }
}

function LoginForm() {
  const [{ form, fieldErrors, formError, status }, dispatch] = useReducer(
    loginFormReducer,
    initialState,
  );

  function validateField(field: LoginField, value: string) {
    const result = loginSchema.shape[field].safeParse(value);
    dispatch({
      type: "fieldValidated",
      field,
      error: result.success ? undefined : result.error.issues[0]?.message,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const errors = z.flattenError(result.error).fieldErrors;
      dispatch({
        type: "formValidated",
        errors: {
          idInstance: errors.idInstance?.[0],
          apiTokenInstance: errors.apiTokenInstance?.[0],
        },
      });
      return;
    }

    dispatch({ type: "submitStarted" });
    const response = await getStateInstance(result.data);

    if (!response.ok) {
      switch (response.error.type) {
        case "invalidIdInstance":
          dispatch({
            type: "submitFailed",
            fieldErrors: { idInstance: "Неверный idInstance" },
          });
          break;
        case "invalidApiTokenInstance":
          dispatch({
            type: "submitFailed",
            fieldErrors: { apiTokenInstance: "Неверный apiTokenInstance" },
          });
          break;
        case "serviceUnavailable":
          dispatch({
            type: "submitFailed",
            formError: "Сервис GREEN-API недоступен, попробуйте позже",
          });
          break;
      }
      return;
    }

    if (response.state !== "authorized") {
      dispatch({
        type: "submitFailed",
        formError: stateInstanceMessages[response.state],
      });
      return;
    }

    useAuthStore.getState().login(result.data);
    dispatch({ type: "submitSucceeded" });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="idInstance">idInstance</Label>
        <Input
          id="idInstance"
          name="idInstance"
          autoComplete="off"
          value={form.idInstance}
          onChange={(event) =>
            dispatch({ type: "setIdInstance", value: event.target.value })
          }
          onBlur={(event) => validateField("idInstance", event.target.value)}
          aria-invalid={Boolean(fieldErrors.idInstance)}
        />
        {fieldErrors.idInstance && (
          <p className="text-sm text-destructive">{fieldErrors.idInstance}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="apiTokenInstance">apiTokenInstance</Label>
        <Input
          id="apiTokenInstance"
          name="apiTokenInstance"
          type="password"
          autoComplete="off"
          value={form.apiTokenInstance}
          onChange={(event) =>
            dispatch({ type: "setApiTokenInstance", value: event.target.value })
          }
          onBlur={(event) =>
            validateField("apiTokenInstance", event.target.value)
          }
          aria-invalid={Boolean(fieldErrors.apiTokenInstance)}
        />
        {fieldErrors.apiTokenInstance && (
          <p className="text-sm text-destructive">
            {fieldErrors.apiTokenInstance}
          </p>
        )}
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button
        type="submit"
        className="mt-2 w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Вход…" : "Войти"}
      </Button>
    </form>
  );
}

export default LoginForm;
