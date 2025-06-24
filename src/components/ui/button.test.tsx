import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
	it("should render with default props", () => {
		render(<Button>Click me</Button>);

		const button = screen.getByRole("button", { name: "Click me" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute("data-slot", "button");
	});

	it("should handle click events", async () => {
		const handleClick = jest.fn();
		const user = userEvent.setup();

		render(<Button onClick={handleClick}>Click me</Button>);

		const button = screen.getByRole("button", { name: "Click me" });
		await user.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("should apply different variants", () => {
		const { rerender } = render(<Button variant="destructive">Delete</Button>);

		let button = screen.getByRole("button", { name: "Delete" });
		expect(button).toHaveClass("bg-destructive");

		rerender(<Button variant="outline">Cancel</Button>);
		button = screen.getByRole("button", { name: "Cancel" });
		expect(button).toHaveClass("border");

		rerender(<Button variant="ghost">Ghost</Button>);
		button = screen.getByRole("button", { name: "Ghost" });
		expect(button).toHaveClass("hover:bg-accent");
	});

	it("should apply different sizes", () => {
		const { rerender } = render(<Button size="sm">Small</Button>);

		let button = screen.getByRole("button", { name: "Small" });
		expect(button).toHaveClass("h-8");

		rerender(<Button size="lg">Large</Button>);
		button = screen.getByRole("button", { name: "Large" });
		expect(button).toHaveClass("h-10");

		rerender(<Button size="icon">I</Button>);
		button = screen.getByRole("button", { name: "I" });
		expect(button).toHaveClass("size-9");
	});

	it("should be disabled when disabled prop is true", () => {
		render(<Button disabled>Disabled</Button>);

		const button = screen.getByRole("button", { name: "Disabled" });
		expect(button).toBeDisabled();
		expect(button).toHaveClass("disabled:opacity-50");
	});

	it("should render as child when asChild is true", () => {
		render(
			<Button asChild>
				<a href="/test">Link Button</a>
			</Button>,
		);

		const link = screen.getByRole("link", { name: "Link Button" });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/test");
		expect(link).toHaveAttribute("data-slot", "button");
	});

	it("should merge custom className with button styles", () => {
		render(<Button className="custom-class">Styled</Button>);

		const button = screen.getByRole("button", { name: "Styled" });
		expect(button).toHaveClass("custom-class");
		expect(button).toHaveClass("inline-flex"); // Base button class
	});

	it("should forward other props to button element", () => {
		render(
			<Button type="submit" aria-label="Submit form">
				Submit
			</Button>,
		);

		const button = screen.getByRole("button", { name: "Submit form" });
		expect(button).toHaveAttribute("type", "submit");
		expect(button).toHaveAttribute("aria-label", "Submit form");
	});
});
