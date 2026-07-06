import { ref } from 'vue'

export function useSimulation() {
  const telemetryActive = ref(false)
  const car = ref({
    x: 150,
    y: 500,
    speed: 0,
    acceleration: 0.2,
    maxSpeed: 5,
    friction: 0.05,
    angle: 0,
  })
  const obstacle = ref({ x: 150, y: 0, speed: 2 })

  let animationFrameId = null
  const controls = { forward: false, backward: false, left: false, right: false }

  const updatePhysics = () => {
    const c = car.value
    if (controls.forward) c.speed += c.acceleration
    if (controls.backward) c.speed -= c.acceleration

    // Friction & Caps
    if (c.speed > c.maxSpeed) c.speed = c.maxSpeed
    if (c.speed < -c.maxSpeed / 2) c.speed = -c.maxSpeed / 2
    if (c.speed > 0) c.speed -= c.friction
    if (c.speed < 0) c.speed += c.friction
    if (Math.abs(c.speed) < c.friction) c.speed = 0

    // Steering
    if (c.speed !== 0) {
      const flip = c.speed > 0 ? 1 : -1
      if (controls.left) c.angle += 0.03 * flip
      if (controls.right) c.angle -= 0.03 * flip
    }

    c.x -= Math.sin(c.angle) * c.speed
    c.y -= Math.cos(c.angle) * c.speed

    // Traffic Recycle
    obstacle.value.y += obstacle.value.speed
    if (obstacle.value.y > c.y + 600) {
      obstacle.value.y = c.y - 600
      obstacle.value.x = [90, 150, 210][Math.floor(Math.random() * 3)]
    }
  }

  const startSimulation = (canvas) => {
    const ctx = canvas.getContext('2d')
    const draw = () => {
      updatePhysics()
      const camY = car.value.y - canvas.height * 0.7

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(-(car.value.x - canvas.width / 2), -camY)

      // Road
      ctx.strokeStyle = '#222'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(50, -10000)
      ctx.lineTo(50, 10000)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(250, -10000)
      ctx.lineTo(250, 10000)
      ctx.stroke()

      // Obstacle
      ctx.fillStyle = '#444'
      ctx.fillRect(obstacle.value.x - 20, obstacle.value.y - 35, 40, 70)

      // System Node (Car)
      ctx.save()
      ctx.translate(car.value.x, car.value.y)
      ctx.rotate(-car.value.angle)
      ctx.fillStyle = '#31ccec'
      ctx.fillRect(-15, -30, 30, 60)
      ctx.restore()

      ctx.restore()
      animationFrameId = requestAnimationFrame(draw)
    }
    draw()
  }

  const stopSimulation = () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    telemetryActive.value = false
  }

  return { telemetryActive, car, obstacle, controls, startSimulation, stopSimulation }
}
